package com.mathtutor.service;

import com.mathtutor.repo.ChatRepository;
import com.mathtutor.repo.MessageRepository;
import com.mathtutor.repo.UsageRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class ChatService {

    private static final int CHECK_MAX_TOKENS = 2048;
    private static final Map<String, String> CULTURE_KEYS = Map.of(
            "mn-cyrl", "mn",
            "mn-mong", "mn",
            "bo", "bo",
            "kk", "kk",
            "ug", "ug",
            "ko", "ko",
            "za", "za");

    private final ChatRepository chats;
    private final MessageRepository messages;
    private final UsageRepository usage;
    private final PromptService prompts;
    private final TopicExtractor topicExtractor;
    private final ContextBuilder contextBuilder;
    private final AiClient aiClient;
    private final AnswerCache answerCache;
    private final CultureService culture;

    public ChatService(
            ChatRepository chats,
            MessageRepository messages,
            UsageRepository usage,
            PromptService prompts,
            TopicExtractor topicExtractor,
            ContextBuilder contextBuilder,
            AiClient aiClient,
            AnswerCache answerCache,
            CultureService culture) {
        this.chats = chats;
        this.messages = messages;
        this.usage = usage;
        this.prompts = prompts;
        this.topicExtractor = topicExtractor;
        this.contextBuilder = contextBuilder;
        this.aiClient = aiClient;
        this.answerCache = answerCache;
        this.culture = culture;
    }

    public record StreamSetup(
            String activeChatId,
            AiClient.AiStream stream,
            boolean cacheHit,
            boolean checkMode) {
    }

    public StreamSetup prepareMessageStream(String userId, String message, String chatId, String preferredLanguage)
            throws java.io.IOException {
        String language = preferredLanguage == null || preferredLanguage.isBlank()
                ? "en"
                : preferredLanguage;
        String systemPrompt = prompts.getSystemPrompt(language);

        String trimmed = message.trim();
        boolean checkMode = trimmed.startsWith("/check ");
        String content = checkMode ? trimmed.substring("/check ".length()).trim() : trimmed;
        if (content.isEmpty()) {
            content = trimmed;
            checkMode = false;
        }

        String activeChatId = chatId;

        String topic = null;
        if (activeChatId != null && !activeChatId.isBlank()) {
            Optional<ChatRepository.ChatRecord> existing = chats.findById(activeChatId);
            if (existing.isEmpty() || !existing.get().user_id().equals(userId)) {
                throw new com.mathtutor.web.ForbiddenException();
            }
            messages.addMessage(activeChatId, "user", content, 0);
            chats.updateChat(activeChatId, "preview", truncate(content, 100));
            topic = topicExtractor.extractTopic(content);
            if (topic != null) {
                chats.updateChat(activeChatId, "topic", topic);
            }
        } else {
            activeChatId = createNewChat(userId, content);
        }

        // B12 /check: validate-only turn — no history, tiny prompt, capped tokens.
        if (checkMode) {
            AiClient.AiStream stream = aiClient.streamChat(
                    contextBuilder.buildCheckContext(content), CHECK_MAX_TOKENS);
            return new StreamSetup(activeChatId, stream, false, true);
        }

        Optional<String> cached = answerCache.lookup(content, language, topic);
        if (cached.isPresent()) {
            answerCache.store(content, language, topic, cached.get());
            return new StreamSetup(activeChatId, new CachedStream(cached.get()), true, false);
        }

        List<MessageRepository.MessageRecord> history =
                messages.findRecent(activeChatId, ContextBuilder.MAX_HISTORY_FETCH);

        // A5: pinned messages become the compact context (plus the last 2 turns),
        // so bookmarked explanations carry forward instead of the full history.
        List<ContextBuilder.ContextMessage> contextMessages = new ArrayList<>();
        List<MessageRepository.MessageRecord> pinned = messages.findPinned(activeChatId);
        if (!pinned.isEmpty()) {
            int pinnedStart = Math.max(0, pinned.size() - 8);
            for (int i = pinnedStart; i < pinned.size(); i++) {
                contextMessages.add(toContextMessage(pinned.get(i)));
            }
            int tailStart = Math.max(0, history.size() - 2);
            for (int i = tailStart; i < history.size(); i++) {
                contextMessages.add(toContextMessage(history.get(i)));
            }
        } else {
            for (MessageRepository.MessageRecord msg : history) {
                contextMessages.add(toContextMessage(msg));
            }
        }

        List<String> tailBlocks = new ArrayList<>();
        // C16: culture keyword packs are appended as a tail user block so the
        // system-prompt prefix stays byte-identical (A2 cache invariant).
        String cultureKey = CULTURE_KEYS.get(language);
        if (cultureKey != null) {
            List<String> keywords = culture.keywords(cultureKey).orElse(List.of());
            if (!keywords.isEmpty()) {
                tailBlocks.add("When giving examples or word problems, where natural, include these "
                        + "cultural references from the student's community: "
                        + String.join(", ", keywords) + ".");
            }
        }

        AiClient.AiStream stream = aiClient.streamChat(buildFullContext(systemPrompt, contextMessages, content, tailBlocks));
        return new StreamSetup(activeChatId, stream, false, false);
    }

    private ContextBuilder.ContextMessage toContextMessage(MessageRepository.MessageRecord msg) {
        return new ContextBuilder.ContextMessage(msg.role(), msg.content());
    }

    public void saveAssistantMessage(String chatId, String userId, String fullResponse, String question, String language,
            AiClient.Usage tokenUsage, String ip) {
        if (fullResponse == null || fullResponse.trim().isEmpty()) {
            return;
        }
        messages.addMessage(chatId, "assistant", fullResponse, 0);
        int request = tokenUsage == null ? 0 : tokenUsage.requestTokens();
        int response = tokenUsage == null ? 0 : tokenUsage.responseTokens();
        usage.logUsage(userId, chatId, request, response, "deepseek-v4-flash", ip);
        if (question != null && !question.isBlank()) {
            answerCache.store(question, language == null ? "en" : language, null, fullResponse);
        }
    }

    private static final class CachedStream implements AiClient.AiStream {
        private final String content;
        private boolean served = false;

        CachedStream(String content) {
            this.content = content;
        }

        @Override
        public String next() {
            if (served) {
                return null;
            }
            served = true;
            return content;
        }

        @Override
        public AiClient.Usage usage() {
            return new AiClient.Usage(0, 0, 0);
        }

        @Override
        public void close() {
        }
    }

    private String createNewChat(String userId, String message) {
        String id = UUID.randomUUID().toString();
        String title = truncateTitle(message);
        chats.createChatWithId(id, userId, title, truncate(message, 100));
        String topic = topicExtractor.extractTopic(message);
        if (topic != null) {
            chats.updateChat(id, "topic", topic);
        }
        messages.addMessage(id, "user", message, 0);
        return id;
    }

    private List<ContextBuilder.ContextMessage> buildFullContext(
            String systemPrompt,
            List<ContextBuilder.ContextMessage> history,
            String newMessage,
            List<String> tailBlocks) {
        return contextBuilder.buildContext(systemPrompt, history, newMessage, tailBlocks);
    }

    private String truncateTitle(String message) {
        return message.length() > 50 ? message.substring(0, 50) + "..." : message;
    }

    private String truncate(String value, int max) {
        return value.length() > max ? value.substring(0, max) : value;
    }
}
