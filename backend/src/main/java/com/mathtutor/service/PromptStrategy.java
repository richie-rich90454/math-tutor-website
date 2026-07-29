package com.mathtutor.service;

import com.mathtutor.dto.ChatMessage;
import java.util.List;

public interface PromptStrategy {

    String getSystemPrompt(String language);

    List<ChatMessage> buildMessages(String userMessage, List<ChatMessage> history, String language);
}
