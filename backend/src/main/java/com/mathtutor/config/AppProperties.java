package com.mathtutor.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Database database,
        Auth auth,
        Ai ai,
        Cors cors,
        Prompts prompts) {

    public record Database(String path) {
    }

    public record Auth(String sessionSecret) {
    }

    public record Ai(
            String apiKey,
            String baseUrl,
            String model,
            String visionModel) {
    }

    public record Cors(List<String> allowedOrigins) {
    }

    public record Prompts(String classpathDir) {
    }
}
