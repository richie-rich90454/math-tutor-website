package com.mathtutor.client;

import com.mathtutor.dto.ChatMessage;
import com.mathtutor.dto.OpenAiResponse;
import java.util.List;
import java.util.function.Consumer;

public interface OpenAiClient {

    OpenAiResponse sendMessage(List<ChatMessage> messages);

    void sendMessageStream(List<ChatMessage> messages, Consumer<String> onChunk, Runnable onComplete, Consumer<Throwable> onError);
}
