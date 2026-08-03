package com.mathtutor.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CultureService {

    private final Map<String, List<String>> keywordsByLanguage = new LinkedHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CultureService() {
        loadAll();
    }

    public Optional<List<String>> keywords(String language) {
        if (language == null || language.isBlank()) {
            return Optional.empty();
        }
        List<String> keywords = keywordsByLanguage.get(language);
        return keywords == null || keywords.isEmpty() ? Optional.empty() : Optional.of(keywords);
    }

    private void loadAll() {
        try {
            Resource[] resources = new PathMatchingResourcePatternResolver()
                    .getResources("classpath*:culture/*.json");
            for (Resource resource : resources) {
                try (InputStream in = resource.getInputStream()) {
                    JsonNode root = objectMapper.readTree(in);
                    String language = root.path("language").asText();
                    List<String> keywords = new ArrayList<>();
                    for (JsonNode node : root.path("keywords")) {
                        keywords.add(node.asText());
                    }
                    keywordsByLanguage.put(language, keywords);
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load culture packs", e);
        }
    }
}
