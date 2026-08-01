package com.mathtutor.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Loads KEY=VALUE pairs from the repository-root .env file into the Spring
 * environment so the backend picks up SESSION_SECRET, API keys, etc. without
 * requiring the developer to export them manually. Only fills in values that
 * are not already present as real environment variables.
 */
public class DotEnvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String SOURCE_NAME = "mathTutorDotEnv";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path root = Paths.get("").toAbsolutePath();
        // When launched from the backend/ dir, resolve the repo root as parent.
        Path envFile = root.resolve(".env");
        if (!Files.isRegularFile(envFile)) {
            envFile = root.getParent() == null ? null : root.getParent().resolve(".env");
        }
        System.out.println("[dotenv] cwd=" + root + " envFile=" + envFile
                + (envFile != null && Files.isRegularFile(envFile) ? " FOUND" : " MISSING"));
        if (envFile == null || !Files.isRegularFile(envFile)) {
            return;
        }

        try {
            Map<String, Object> props = parse(Files.readAllLines(envFile, StandardCharsets.UTF_8));
            if (props.isEmpty()) {
                return;
            }
            MutablePropertySources sources = environment.getPropertySources();
            if (!sources.contains(SOURCE_NAME)) {
                sources.addFirst(new MapPropertySource(SOURCE_NAME, props));
            }
        } catch (IOException e) {
            // Ignore: missing/unreadable .env should not prevent startup.
        }
    }

    private Map<String, Object> parse(List<String> lines) {
        Map<String, Object> props = new LinkedHashMap<>();
        for (String raw : lines) {
            String line = raw.trim();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }
            int eq = line.indexOf('=');
            if (eq <= 0) {
                continue;
            }
            String key = line.substring(0, eq).trim();
            String value = line.substring(eq + 1).trim();
            if (value.length() >= 2
                    && ((value.startsWith("\"") && value.endsWith("\""))
                    || (value.startsWith("'") && value.endsWith("'")))) {
                value = value.substring(1, value.length() - 1);
            }
            props.put(key, value);
        }
        return props;
    }
}
