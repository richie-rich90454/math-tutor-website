package com.mathtutor.service;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class ContextBuilder {

    public static final int MAX_CONTEXT_MESSAGES = 20;

    public record ContextMessage(String role, String content) {
    }

    public List<ContextMessage> buildContext(
            String systemPrompt,
            List<ContextMessage> history,
            String newMessage) {
        List<ContextMessage> context = new ArrayList<>();
        context.add(new ContextMessage("system", systemPrompt));

        int start = Math.max(0, history.size() - MAX_CONTEXT_MESSAGES);
        for (int i = start; i < history.size(); i++) {
            context.add(history.get(i));
        }

        context.add(new ContextMessage("user", newMessage));
        return context;
    }
}
