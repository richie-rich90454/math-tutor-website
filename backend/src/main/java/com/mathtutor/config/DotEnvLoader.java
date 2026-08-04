package com.mathtutor.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Loads KEY=VALUE pairs from the repository-root .env file into system
 * properties so the backend picks up SESSION_SECRET, API keys, etc. without
 * requiring the developer to export them manually. Real environment variables
 * always win; .env only fills in missing values.
 */
public final class DotEnvLoader {

    private DotEnvLoader() {
    }

    public static void load() {
        Path root = Paths.get("").toAbsolutePath();
        // When launched from the backend/ dir, resolve the repo root as parent.
        Path envFile = root.resolve(".env");
        if (!Files.isRegularFile(envFile)) {
            Path parent = root.getParent();
            if (parent != null) {
                envFile = parent.resolve(".env");
            }
        }
        if (envFile == null || !Files.isRegularFile(envFile)) {
            return;
        }

        try {
            for (Map.Entry<String, String> entry : parse(Files.readAllLines(envFile, StandardCharsets.UTF_8)).entrySet()) {
                String key = entry.getKey();
                if (System.getenv().containsKey(key)) {
                    continue;
                }
                if (System.getProperty(key) == null) {
                    System.setProperty(key, entry.getValue());
                }
            }
        } catch (IOException e) {
            // Ignore: missing/unreadable .env should not prevent startup.
        }
    }

    private static Map<String, String> parse(List<String> lines) {
        Map<String, String> props = new LinkedHashMap<>();
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
