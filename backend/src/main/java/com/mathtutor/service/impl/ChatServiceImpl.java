package com.mathtutor.service.impl;

import com.mathtutor.client.OpenAiClient;
import com.mathtutor.dto.ChatMessage;
import com.mathtutor.dto.ChatRequest;
import com.mathtutor.dto.ChatResponse;
import com.mathtutor.dto.OpenAiResponse;
import com.mathtutor.service.ChatService;
import com.mathtutor.service.PromptService;
import com.mathtutor.service.PromptStrategy;
import java.util.List;
import java.util.function.Consumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ChatServiceImpl implements ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatServiceImpl.class);

    private final OpenAiClient openAiClient;
    private final PromptStrategy promptStrategy;

    public ChatServiceImpl(OpenAiClient openAiClient, PromptService promptService) {
        this.openAiClient = openAiClient;
        this.promptStrategy = new GeneralMathStrategy(promptService);
    }

    @Override
    public ChatResponse sendMessage(ChatRequest request) {
        String language = request.getLanguage();
        List<ChatMessage> messages = promptStrategy.buildMessages(request.getMessage(), request.getHistory(), language);
        log.debug("Sending chat message to OpenAI, history size: {}, language: {}", request.getHistory() != null ? request.getHistory().size() : 0, language);
        OpenAiResponse response = openAiClient.sendMessage(messages);
        String reply = extractReply(response);
        return new ChatResponse(request.getSessionId(), reply);
    }

    @Override
    public void sendMessageStream(ChatRequest request, Consumer<String> onChunk, Runnable onComplete, Consumer<Throwable> onError) {
        String language = request.getLanguage();
        List<ChatMessage> messages = promptStrategy.buildMessages(request.getMessage(), request.getHistory(), language);
        openAiClient.sendMessageStream(messages, onChunk, onComplete, onError);
    }

    private String extractReply(OpenAiResponse response) {
        if (response.getChoices() != null && !response.getChoices().isEmpty()) {
            OpenAiResponse.Choice choice = response.getChoices().get(0);
            if (choice.getMessage() != null) {
                return choice.getMessage().getContent();
            }
        }
        return "";
    }
}
