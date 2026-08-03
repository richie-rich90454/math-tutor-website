package com.mathtutor.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ProblemBank {

    private final Map<String, Problem> byId = new ConcurrentHashMap<>();
    private final Map<String, List<Problem>> byTopicAndLanguage = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ProblemBank() {
        loadAll();
    }

    public record Problem(
            String id,
            String topic,
            int grade,
            String question,
            List<String> options,
            int answerIndex,
            String explanation,
            String language) {
    }

    public Optional<Problem> findById(String id) {
        return Optional.ofNullable(byId.get(id));
    }

    public List<Problem> list(String topic, String language, Integer grade, Integer limit) {
        String lang = normalizeLanguage(language);
        List<Problem> pool = filter(topic, lang);
        List<Problem> out = new ArrayList<>();
        for (Problem p : pool) {
            if (grade != null && p.grade() != grade) {
                continue;
            }
            out.add(p);
            if (limit != null && out.size() >= limit) {
                break;
            }
        }
        return out;
    }

    // Deterministic per-day pick (B11): epochDay modulo the pool size. No AI,
    // no storage — the same day always yields the same problem per topic+language.
    public Optional<Problem> problemOfDay(String topic, String language) {
        List<Problem> pool = filter(topic, normalizeLanguage(language));
        if (pool.isEmpty()) {
            return Optional.empty();
        }
        long dayIndex = ChronoUnit.DAYS.between(LocalDate.of(1970, 1, 1), LocalDate.now());
        long seed = (dayIndex + topicSeed(topic)) % pool.size();
        return Optional.of(pool.get((int) seed));
    }

    private List<Problem> filter(String topic, String language) {
        String key = (topic == null || topic.isBlank() ? "*" : topic) + ":" + language;
        List<Problem> pool = byTopicAndLanguage.get(key);
        if (pool != null) {
            return pool;
        }
        pool = new ArrayList<>();
        for (Problem p : byId.values()) {
            if (p.language().equals(language)
                    && (topic == null || topic.isBlank() || p.topic().equalsIgnoreCase(topic))) {
                pool.add(p);
            }
        }
        pool.sort((a, b) -> Integer.compare(a.grade(), b.grade()));
        byTopicAndLanguage.put(key, pool);
        return pool;
    }

    private long topicSeed(String topic) {
        if (topic == null || topic.isBlank()) {
            return 0;
        }
        return topic.hashCode() & 0x7fffffff;
    }

    private String normalizeLanguage(String language) {
        String lang = language == null || language.isBlank() ? "en" : language;
        if (!byId.isEmpty() && byId.values().stream().noneMatch(p -> p.language().equals(lang))) {
            return "en";
        }
        return lang;
    }

    private void loadAll() {
        try {
            Resource[] resources = new PathMatchingResourcePatternResolver()
                    .getResources("classpath*:problems/*.json");
            for (Resource resource : resources) {
                loadFile(resource);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load problem bank", e);
        }
    }

    private void loadFile(Resource resource) throws IOException {
        try (InputStream in = resource.getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            JsonNode problems = root.path("problems");
            for (JsonNode node : problems) {
                List<String> options = new ArrayList<>();
                for (JsonNode opt : node.path("options")) {
                    options.add(opt.asText());
                }
                Problem problem = new Problem(
                        node.path("id").asText(),
                        node.path("topic").asText(),
                        node.path("grade").asInt(1),
                        node.path("question").asText(),
                        options,
                        node.path("answerIndex").asInt(0),
                        node.path("explanation").asText(),
                        node.path("language").asText("en"));
                byId.put(problem.id(), problem);
            }
        }
    }

    public Map<String, Object> toJson(Problem p) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", p.id());
        map.put("topic", p.topic());
        map.put("grade", p.grade());
        map.put("question", p.question());
        map.put("options", p.options());
        map.put("answerIndex", p.answerIndex());
        map.put("explanation", p.explanation());
        map.put("language", p.language());
        return map;
    }
}
