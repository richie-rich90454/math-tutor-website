package com.mathtutor.service;

import com.mathtutor.repo.ChatRepository;
import com.mathtutor.repo.MessageRepository;
import com.mathtutor.repo.UsageRepository;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class VisionChatService {

    private static final String VISION_SYSTEM_PROMPT =
            "You are an expert math tutor. The user has shared an image containing a math problem. Analyze the image carefully, identify the math problem, and solve it step by step. Use LaTeX for all mathematical expressions. Be clear and thorough.";

    private final ChatRepository chats;
    private final MessageRepository messages;
    private final UsageRepository usage;
    private final ContextBuilder contextBuilder;
    private final AiClient aiClient;

    public VisionChatService(
            ChatRepository chats,
            MessageRepository messages,
            UsageRepository usage,
            ContextBuilder contextBuilder,
            AiClient aiClient) {
        this.chats = chats;
        this.messages = messages;
        this.usage = usage;
        this.contextBuilder = contextBuilder;
        this.aiClient = aiClient;
    }

    public record VisionStreamSetup(
            String activeChatId,
            AiClient.AiStream stream) {
    }

    public VisionStreamSetup prepareVisionStream(
            String userId,
            String image,
            String message,
            String chatId) throws IOException {
        if (image == null || !image.startsWith("data:")) {
            throw new com.mathtutor.web.ForbiddenException("Only data URLs are accepted for image uploads");
        }
        String sanitized = (message == null ? "" : message).trim();
        String userText = sanitized.isEmpty()
                ? "Please analyze this image and solve any math problem you see. Show your work step by step."
                : sanitized;

        String activeChatId = chatId;
        if (activeChatId != null && !activeChatId.isBlank()) {
            Optional<ChatRepository.ChatRecord> existing = chats.findById(activeChatId);
            if (existing.isEmpty() || !existing.get().user_id().equals(userId)) {
                throw new com.mathtutor.web.ForbiddenException();
            }
            messages.addMessage(activeChatId, "user", "[Image] " + userText, 0);
            chats.updateChat(activeChatId, "preview", truncate(userText, 100));
        } else {
            activeChatId = UUID.randomUUID().toString();
            String title = truncateTitle(userText);
            chats.createChatWithId(activeChatId, userId, title, truncate(userText, 100));
            messages.addMessage(activeChatId, "user", "[Image] " + userText, 0);
        }

        List<ContextBuilder.ContextMessage> contextMessages = new ArrayList<>();
        contextMessages.add(new ContextBuilder.ContextMessage("system", VISION_SYSTEM_PROMPT));

        List<MessageRepository.MessageRecord> history = messages.findRecent(activeChatId, 20);
        for (MessageRepository.MessageRecord msg : history) {
            contextMessages.add(new ContextBuilder.ContextMessage(msg.role(), msg.content()));
        }

        AiClient.AiStream stream = aiClient.streamVisionChat(contextMessages, userText, image);
        return new VisionStreamSetup(activeChatId, stream);
    }

    public void saveAssistantMessage(String chatId, String userId, String fullResponse) {
        if (fullResponse == null || fullResponse.trim().isEmpty()) {
            return;
        }
        messages.addMessage(chatId, "assistant", fullResponse, 0);
        usage.logUsage(userId, chatId, 0, 0, "deepseek-v4-flash");
    }

    private String truncateTitle(String message) {
        return message.length() > 50 ? message.substring(0, 50) + "..." : message;
    }

    private String truncate(String value, int max) {
        return value.length() > max ? value.substring(0, max) : value;
    }
}
