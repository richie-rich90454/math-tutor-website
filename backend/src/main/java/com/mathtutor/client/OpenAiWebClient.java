package com.mathtutor.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mathtutor.dto.ChatMessage;
import com.mathtutor.dto.OpenAiRequest;
import com.mathtutor.dto.OpenAiResponse;
import java.util.List;
import java.util.function.Consumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

@Component
public class OpenAiWebClient implements OpenAiClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiWebClient.class);

    private final WebClient webClient;
    private final String model;
    private final ObjectMapper objectMapper;

    public OpenAiWebClient(
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            @Value("${openai.base-url}") String baseUrl,
            @Value("${openai.api-key}") String apiKey,
            @Value("${openai.model}") String model) {
        this.model = model;
        this.objectMapper = objectMapper;
        this.webClient = webClientBuilder
                .baseUrl(baseUrl + "/chat/completions")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    @Override
    public OpenAiResponse sendMessage(List<ChatMessage> messages) {
        OpenAiRequest request = new OpenAiRequest(model, messages, false);
        return webClient.post()
                .bodyValue(request)
                .retrieve()
                .bodyToMono(OpenAiResponse.class)
                .block();
    }

    @Override
    public void sendMessageStream(List<ChatMessage> messages, Consumer<String> onChunk, Runnable onComplete, Consumer<Throwable> onError) {
        OpenAiRequest request = new OpenAiRequest(model, messages, true);
        webClient.post()
                .bodyValue(request)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .retrieve()
                .bodyToFlux(String.class)
                .filter(line -> line != null && line.startsWith("data: "))
                .map(line -> line.substring(6).trim())
                .filter(data -> !data.isEmpty() && !"[DONE]".equals(data))
                .flatMap(data -> {
                    try {
                        OpenAiResponse chunk = objectMapper.readValue(data, OpenAiResponse.class);
                        String content = "";
                        if (chunk.getChoices() != null && !chunk.getChoices().isEmpty()) {
                            OpenAiResponse.Choice choice = chunk.getChoices().get(0);
                            if (choice.getDelta() != null && choice.getDelta().getContent() != null) {
                                content = choice.getDelta().getContent();
                            }
                        }
                        return Flux.just(content);
                    } catch (Exception e) {
                        log.warn("Failed to parse SSE chunk: {}", e.getMessage());
                        return Flux.empty();
                    }
                })
                .filter(content -> !content.isEmpty())
                .subscribe(onChunk::accept, onError::accept, onComplete);
    }
}
