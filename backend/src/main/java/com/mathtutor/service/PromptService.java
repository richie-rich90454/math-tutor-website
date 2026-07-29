package com.mathtutor.service;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class PromptService {

    private static final Logger log = LoggerFactory.getLogger(PromptService.class);
    private static final String PROMPT_DIR = "/prompts/";
    private static final String DEFAULT_LANG = "en-us";

    private final Map<String, String> cache = new ConcurrentHashMap<>();

    public String getPrompt(String lang) {
        if (lang == null || lang.isEmpty()) {
            lang = DEFAULT_LANG;
        }
        String key = lang.toLowerCase().replace("-", "_");
        return cache.computeIfAbsent(key, k -> loadPrompt(k));
    }

    private String loadPrompt(String langKey) {
        String[] candidates = {langKey, langKey.replace("_", "-"), DEFAULT_LANG};
        for (String candidate : candidates) {
            String fileName = "prompt-" + candidate + ".txt";
            try (InputStream is = getClass().getResourceAsStream(PROMPT_DIR + fileName)) {
                if (is != null) {
                    try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                        String content = reader.lines().collect(Collectors.joining("\n"));
                        log.debug("Loaded prompt file: {}", fileName);
                        return content;
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to load prompt file {}: {}", fileName, e.getMessage());
            }
        }
        log.warn("No prompt file found for lang {}, using default", langKey);
        return "You are a knowledgeable math tutor. Explain concepts clearly and step by step.";
    }
}
