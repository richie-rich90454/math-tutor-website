package com.mathtutor.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.mathtutor.config.AppProperties;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class AiClient {

    private final AppProperties props;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AiClient(AppProperties props, ObjectMapper objectMapper) {
        this.props = props;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    public AiStream streamChat(List<ContextBuilder.ContextMessage> messages) throws IOException {
        return streamChat(messages, 5000);
    }

    public AiStream streamChat(List<ContextBuilder.ContextMessage> messages, int maxTokens) throws IOException {        String apiKey = props.ai().apiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IOException("API key not configured");
        }

        String baseUrl = props.ai().baseUrl();
        String model = props.ai().model();

        String body;
        try {
            JsonNode payload = objectMapper.createObjectNode()
                    .put("model", model)
                    .put("stream", true)
                    .put("temperature", 0.7)
                    .put("max_tokens", maxTokens)
                    .set("thinking", objectMapper.createObjectNode().put("type", "disabled"))
                    .set("stream_options", objectMapper.createObjectNode().put("include_usage", true))
                    .set("messages", toJsonArray(messages));
            body = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            throw new IOException("Failed to build request body", e);
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/chat/completions"))
                .timeout(Duration.ofSeconds(120))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<InputStream> response = sendWithRetry(request);

        if (response.statusCode() >= 300) {
            String errorText;
            try {
                errorText = new String(response.body().readAllBytes(), StandardCharsets.UTF_8);
            } catch (IOException e) {
                errorText = "";
            }
            throw new IOException("API error " + response.statusCode() + ": "
                    + errorText.substring(0, Math.min(300, errorText.length())));
        }

        return new SseStream(response.body());
    }

    public AiStream streamVisionChat(
            List<ContextBuilder.ContextMessage> textMessages,
            String userText,
            String imageUrl) throws IOException {
        String apiKey = props.ai().apiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IOException("API key not configured");
        }

        String baseUrl = props.ai().baseUrl();
        String model = props.ai().visionModel() == null || props.ai().visionModel().isBlank()
                ? props.ai().model()
                : props.ai().visionModel();

        JsonNode imagePart = objectMapper.createObjectNode()
                .put("type", "image_url")
                .set("image_url", objectMapper.createObjectNode().put("url", imageUrl));

        tools.jackson.databind.node.ArrayNode messagesNode = objectMapper.createArrayNode();
        for (ContextBuilder.ContextMessage msg : textMessages) {
            messagesNode.add(objectMapper.createObjectNode()
                    .put("role", msg.role())
                    .put("content", msg.content()));
        }
        tools.jackson.databind.node.ArrayNode content = objectMapper.createArrayNode();
        content.add(objectMapper.createObjectNode().put("type", "text").put("text", userText));
        content.add(imagePart);
        messagesNode.add(objectMapper.createObjectNode()
                .put("role", "user")
                .set("content", content));

        String body;
        try {
            JsonNode payload = objectMapper.createObjectNode()
                    .put("model", model)
                    .put("stream", true)
                    .put("temperature", 0.7)
                    .put("max_tokens", 4096)
                    .set("thinking", objectMapper.createObjectNode().put("type", "disabled"))
                    .set("stream_options", objectMapper.createObjectNode().put("include_usage", true))
                    .set("messages", messagesNode);
            body = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            throw new IOException("Failed to build vision request body", e);
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/chat/completions"))
                .timeout(Duration.ofSeconds(120))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<InputStream> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Vision request interrupted", e);
        }

        if (response.statusCode() >= 300) {
            String errorText;
            try {
                errorText = new String(response.body().readAllBytes(), StandardCharsets.UTF_8);
            } catch (IOException e) {
                errorText = "";
            }
            throw new IOException("Vision API returned " + response.statusCode()
                    + ": " + errorText.substring(0, Math.min(300, errorText.length())));
        }

        return new SseStream(response.body());
    }

    // Convenience for one-shot generation (notes, study plans): consume the
    // whole stream and return the assembled text. Not for the chat path.
    public String complete(List<ContextBuilder.ContextMessage> messages, int maxTokens) throws IOException {
        try (AiStream stream = streamChat(messages, maxTokens)) {
            StringBuilder out = new StringBuilder();
            String chunk;
            while ((chunk = stream.next()) != null) {
                out.append(chunk);
            }
            return out.toString();
        }
    }

    private HttpResponse<InputStream> sendWithRetry(HttpRequest request) throws IOException {
        for (int attempt = 0; ; attempt++) {
            try {
                HttpResponse<InputStream> response =
                        httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
                if (response.statusCode() < 500) {
                    return response;
                }
                if (attempt < 1) {
                    sleep(2000);
                    continue;
                }
                return response;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("Network request interrupted", e);
            } catch (IOException e) {
                if (attempt < 1) {
                    sleep(1000);
                    continue;
                }
                throw new IOException("Network request failed after 1 retry", e);
            }
        }
    }

    private void sleep(long millis) {
        try {
            TimeUnit.MILLISECONDS.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private JsonNode toJsonArray(List<ContextBuilder.ContextMessage> messages) {
        tools.jackson.databind.node.ArrayNode array = objectMapper.createArrayNode();
        for (ContextBuilder.ContextMessage msg : messages) {
            array.add(objectMapper.createObjectNode()
                    .put("role", msg.role())
                    .put("content", msg.content()));
        }
        return array;
    }

    public record Usage(int requestTokens, int responseTokens, int cachedTokens) {
        public int total() {
            return requestTokens + responseTokens;
        }
    }

    public interface AiStream extends AutoCloseable {
        /** Returns the next text chunk, or null when the stream is complete. */
        String next() throws IOException;

        /** Token usage reported by the provider for this stream, or null if unknown. */
        Usage usage();

        @Override
        void close();
    }

    private class SseStream implements AiStream {
        private final BufferedReader reader;
        private final StringBuilder buffer = new StringBuilder();
        private boolean done = false;
        private boolean closed = false;
        private Usage usage;

        SseStream(InputStream input) {
            this.reader = new BufferedReader(
                    new InputStreamReader(input, StandardCharsets.UTF_8));
        }

        @Override
        public Usage usage() {
            return usage;
        }

        @Override
        public synchronized String next() throws IOException {
            if (closed || done) {
                return null;
            }
            while (true) {
                int newline = indexOfNewline(buffer);
                if (newline >= 0) {
                    String line = buffer.substring(0, newline).trim();
                    buffer.delete(0, newline + 1);
                    String content = parseSseLine(line);
                    if ("__DONE__".equals(content)) {
                        done = true;
                        return null;
                    }
                    if (content != null && !content.isEmpty()) {
                        return content;
                    }
                    continue;
                }

                String read = reader.readLine();
                if (read == null) {
                    done = true;
                    return null;
                }
                buffer.append(read).append('\n');
            }
        }

        private int indexOfNewline(StringBuilder sb) {
            for (int i = 0; i < sb.length(); i++) {
                if (sb.charAt(i) == '\n') {
                    return i;
                }
            }
            return -1;
        }

        private String parseSseLine(String line) throws IOException {
            if (!line.startsWith("data: ")) {
                return null;
            }
            String data = line.substring(6);
            if ("[DONE]".equals(data)) {
                return "__DONE__";
            }
            try {
                JsonNode parsed = objectMapper.readTree(data);
                JsonNode usageNode = parsed.path("usage");
                if (!usageNode.isMissingNode() && !usageNode.isNull()) {
                    this.usage = parseUsage(usageNode);
                }
                JsonNode content = parsed.path("choices").path(0).path("delta").path("content");
                return content.isValueNode() ? content.asString() : null;
            } catch (Exception e) {
                return null;
            }
        }

        private Usage parseUsage(JsonNode usage) {
            int request = usage.path("prompt_tokens").asInt(
                    usage.path("request_tokens").asInt(0));
            int response = usage.path("completion_tokens").asInt(
                    usage.path("response_tokens").asInt(0));
            int cached = usage.path("prompt_cache_hit_tokens").asInt(
                    usage.path("prompt_tokens_details").path("cached_tokens").asInt(0));
            return new Usage(request, response, cached);
        }

        @Override
        public synchronized void close() {
            closed = true;
            try {
                reader.close();
            } catch (IOException ignored) {
                // ignore
            }
        }
    }
}
