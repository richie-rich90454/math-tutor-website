package com.mathtutor.service.impl;

import com.mathtutor.dto.ChatMessage;
import com.mathtutor.service.PromptService;
import com.mathtutor.service.PromptStrategy;
import java.util.ArrayList;
import java.util.List;

public class GeneralMathStrategy implements PromptStrategy {

    private final PromptService promptService;

    public GeneralMathStrategy(PromptService promptService) {
        this.promptService = promptService;
    }

    @Override
    public String getSystemPrompt(String language) {
        String lang = language != null ? language : "en-us";
        String filePrompt = promptService.getPrompt(lang);
        if (filePrompt != null && !filePrompt.isEmpty()) {
            return filePrompt;
        }
        return "You are a knowledgeable math tutor. "
                + "Explain concepts clearly and step by step. "
                + "Use simple language suitable for students. "
                + "When appropriate, include examples. "
                + "If the user asks a question in a language other than English, respond in that same language.";
    }

    @Override
    public List<ChatMessage> buildMessages(String userMessage, List<ChatMessage> history, String language) {
        List<ChatMessage> messages = new ArrayList<>();
        messages.add(new ChatMessage("system", getSystemPrompt(language)));
        if (history != null) {
            messages.addAll(history);
        }
        messages.add(new ChatMessage("user", userMessage));
        return messages;
    }
}
