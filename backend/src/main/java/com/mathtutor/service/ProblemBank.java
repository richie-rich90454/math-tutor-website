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
        try {
            List<Problem> pool = filter(topic, normalizeLanguage(language));
            if (pool.isEmpty()) {
                return Optional.empty();
            }
            long dayIndex = ChronoUnit.DAYS.between(LocalDate.of(1970, 1, 1), LocalDate.now());
            long seed = (dayIndex + topicSeed(topic)) % pool.size();
            return Optional.of(pool.get((int) seed));
        } catch (Exception e) {
            // Never let a bad pick take the endpoint down; return "no problem".
            return Optional.empty();
        }
    }

    private List<Problem> filter(String topic, String language) {
        String key = (topic == null || topic.isBlank() ? "*" : topic) + ":" + language;
        List<Problem> pool = byTopicAndLanguage.get(key);
        if (pool != null) {
            return pool;
        }
        pool = new ArrayList<>();
        for (Problem p : byId.values()) {
            String pLang = p.language();
            String pTopic = p.topic();
            if (pLang != null && pLang.equals(language)
                    && (topic == null || topic.isBlank()
                            || (pTopic != null && pTopic.equalsIgnoreCase(topic)))) {
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

    // China-minority packs and Traditional Chinese use Mandarin (zh-hans) as
    // their education language, so route them to the authored zh-hans problems.
    private static final Map<String, String> LANGUAGE_ALIAS = Map.ofEntries(
            Map.entry("zh-hant", "zh-hans"),
            Map.entry("bca", "zh-hans"), Map.entry("dng", "zh-hans"),
            Map.entry("hni", "zh-hans"), Map.entry("iom", "zh-hans"),
            Map.entry("lic", "zh-hans"), Map.entry("lhu", "zh-hans"),
            Map.entry("lis", "zh-hans"), Map.entry("nxq", "zh-hans"),
            Map.entry("pcc", "zh-hans"), Map.entry("tdd", "zh-hans"),
            Map.entry("tji", "zh-hans"), Map.entry("wbm", "zh-hans"),
            Map.entry("yi", "zh-hans"), Map.entry("za", "zh-hans"));

    private String normalizeLanguage(String language) {
        String lang = language == null || language.isBlank() ? "en" : language;
        lang = LANGUAGE_ALIAS.getOrDefault(lang, lang);
        if (!byId.isEmpty()) {
            boolean any = byId.values().stream()
                    .anyMatch(p -> p.language() != null && p.language().equals(lang));
            if (!any) {
                return "en";
            }
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
                    options.add(opt.asString());
                }
                Problem problem = new Problem(
                        node.path("id").asString(),
                        node.path("topic").asString(),
                        node.path("grade").asInt(1),
                        node.path("question").asString(),
                        options,
                        node.path("answerIndex").asInt(0),
                        node.path("explanation").asString(),
                        node.path("language").asString("en"));
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
