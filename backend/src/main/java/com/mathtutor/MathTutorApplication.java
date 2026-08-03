package com.mathtutor;

import com.mathtutor.config.DotEnvLoader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

import java.util.Set;

@SpringBootApplication
@ConfigurationPropertiesScan
public class MathTutorApplication {

    private static final Logger log = LoggerFactory.getLogger(MathTutorApplication.class);

    private static final Set<String> WEAK_SECRETS = Set.of(
            "changeme", "change-me", "change_me", "secret", "your-secret",
            "your_secret", "session-secret", "default", "password");

    public static void main(String[] args) {
        DotEnvLoader.load();
        checkBootGuards();
        SpringApplication.run(MathTutorApplication.class, args);
    }

    // E2 boot guards: fail fast on a weak SESSION_SECRET (silent misconfiguration
    // would let anyone forge sessions); warn, don't fail, on a placeholder API key.
    private static void checkBootGuards() {
        String secret = env("SESSION_SECRET");
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "SESSION_SECRET is required. Set a random string of at least 32 characters.");
        }
        if (secret.length() < 32 || WEAK_SECRETS.contains(secret.toLowerCase())) {
            throw new IllegalStateException(
                    "SESSION_SECRET is too weak. Use a random string of at least 32 characters.");
        }

        String apiKey = env("OPENAI_COMPATIBLE_API_KEY");
        if (apiKey != null && !apiKey.isBlank() && isPlaceholder(apiKey)) {
            log.warn("OPENAI_COMPATIBLE_API_KEY looks like a placeholder value; AI calls will fail.");
        }
    }

    private static boolean isPlaceholder(String value) {
        String lower = value.toLowerCase();
        return lower.contains("your_")
                || lower.contains("your-")
                || lower.contains("changeme")
                || lower.equals("sk")
                || lower.equals("openai")
                || lower.contains("<");
    }

    private static String env(String name) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? System.getProperty(name) : value;
    }
}
