package com.mathtutor.service;

import com.mathtutor.dto.ChatRequest;
import com.mathtutor.dto.ChatResponse;
import java.util.function.Consumer;

public interface ChatService {

    ChatResponse sendMessage(ChatRequest request);

    void sendMessageStream(ChatRequest request, Consumer<String> onChunk, Runnable onComplete, Consumer<Throwable> onError);
}
