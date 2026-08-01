package com.mathtutor.service;

import com.mathtutor.repo.ChatRepository;
import com.mathtutor.repo.MessageRepository;
import com.mathtutor.repo.UsageRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ChatService {

    private final ChatRepository chats;
    private final MessageRepository messages;
    private final UsageRepository usage;
    private final PromptService prompts;
    private final TopicExtractor topicExtractor;
    private final ContextBuilder contextBuilder;
    private final AiClient aiClient;

    public ChatService(
            ChatRepository chats,
            MessageRepository messages,
            UsageRepository usage,
            PromptService prompts,
            TopicExtractor topicExtractor,
            ContextBuilder contextBuilder,
            AiClient aiClient) {
        this.chats = chats;
        this.messages = messages;
        this.usage = usage;
        this.prompts = prompts;
        this.topicExtractor = topicExtractor;
        this.contextBuilder = contextBuilder;
        this.aiClient = aiClient;
    }

    public record StreamSetup(
            String activeChatId,
            AiClient.AiStream stream) {
    }

    public StreamSetup prepareMessageStream(String userId, String message, String chatId, String preferredLanguage)
            throws java.io.IOException {
        String sanitized = message.trim();
        String activeChatId = chatId;

        String language = preferredLanguage == null || preferredLanguage.isBlank()
                ? "en"
                : preferredLanguage;
        String systemPrompt = prompts.getSystemPrompt(language);

        if (activeChatId != null && !activeChatId.isBlank()) {
            Optional<ChatRepository.ChatRecord> existing = chats.findById(activeChatId);
            if (existing.isPresent()) {
                messages.addMessage(activeChatId, "user", sanitized, 0);
                chats.updateChat(activeChatId, "preview", truncate(sanitized, 100));
                String topic = topicExtractor.extractTopic(sanitized);
                if (topic != null) {
                    chats.updateChat(activeChatId, "topic", topic);
                }
            } else {
                createChatWithId(activeChatId, userId, sanitized);
            }
        } else {
            activeChatId = createNewChat(userId, sanitized);
        }

        List<MessageRepository.MessageRecord> history =
                messages.findRecent(activeChatId, ContextBuilder.MAX_CONTEXT_MESSAGES);

        List<ContextBuilder.ContextMessage> contextMessages = new ArrayList<>();
        for (MessageRepository.MessageRecord msg : history) {
            contextMessages.add(new ContextBuilder.ContextMessage(msg.role(), msg.content()));
        }

        AiClient.AiStream stream = aiClient.streamChat(buildFullContext(systemPrompt, contextMessages, sanitized));
        return new StreamSetup(activeChatId, stream);
    }

    public void saveAssistantMessage(String chatId, String userId, String fullResponse) {
        if (fullResponse == null || fullResponse.trim().isEmpty()) {
            return;
        }
        messages.addMessage(chatId, "assistant", fullResponse, 0);
        usage.logUsage(userId, chatId, 0, 0, "deepseek-v4-flash");
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

    private void createChatWithId(String id, String userId, String message) {
        String title = truncateTitle(message);
        chats.createChatWithId(id, userId, title, truncate(message, 100));
        String topic = topicExtractor.extractTopic(message);
        if (topic != null) {
            chats.updateChat(id, "topic", topic);
        }
        messages.addMessage(id, "user", message, 0);
    }

    private List<ContextBuilder.ContextMessage> buildFullContext(
            String systemPrompt,
            List<ContextBuilder.ContextMessage> history,
            String newMessage) {
        return contextBuilder.buildContext(systemPrompt, history, newMessage);
    }

    private String truncateTitle(String message) {
        return message.length() > 50 ? message.substring(0, 50) + "..." : message;
    }

    private String truncate(String value, int max) {
        return value.length() > max ? value.substring(0, max) : value;
    }
}
