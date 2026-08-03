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
public class SheetsService {

    private final Map<String, SheetTopic> topics = new LinkedHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SheetsService() {
        loadAll();
    }

    public record Formula(String name, String formula, String nativeTerm, String mandarin) {
    }

    public record Term(String term, String nativeTerm, String mandarin) {
    }

    public record SheetTopic(String topic, List<Formula> formulas, List<Term> terms) {
    }

    public Optional<SheetTopic> get(String topic) {
        if (topic == null || topic.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(topics.get(topic.toLowerCase()));
    }

    public List<SheetTopic> all() {
        return List.copyOf(topics.values());
    }

    public Map<String, Object> toJson(SheetTopic sheet) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("topic", sheet.topic());
        List<Map<String, Object>> formulas = new ArrayList<>();
        for (Formula f : sheet.formulas()) {
            Map<String, Object> fm = new LinkedHashMap<>();
            fm.put("name", f.name());
            fm.put("formula", f.formula());
            fm.put("native", f.nativeTerm());
            fm.put("mandarin", f.mandarin());
            formulas.add(fm);
        }
        List<Map<String, Object>> terms = new ArrayList<>();
        for (Term t : sheet.terms()) {
            Map<String, Object> tm = new LinkedHashMap<>();
            tm.put("term", t.term());
            tm.put("native", t.nativeTerm());
            tm.put("mandarin", t.mandarin());
            terms.add(tm);
        }
        map.put("formulas", formulas);
        map.put("terms", terms);
        return map;
    }

    private void loadAll() {
        try {
            Resource[] resources = new PathMatchingResourcePatternResolver()
                    .getResources("classpath*:sheets/*.json");
            for (Resource resource : resources) {
                try (InputStream in = resource.getInputStream()) {
                    JsonNode root = objectMapper.readTree(in);
                    String topic = root.path("topic").asText().toLowerCase();
                    List<Formula> formulas = new ArrayList<>();
                    for (JsonNode node : root.path("formulas")) {
                        formulas.add(new Formula(
                                node.path("name").asText(),
                                node.path("formula").asText(),
                                node.path("native").asText(),
                                node.path("mandarin").asText()));
                    }
                    List<Term> terms = new ArrayList<>();
                    for (JsonNode node : root.path("terms")) {
                        terms.add(new Term(
                                node.path("term").asText(),
                                node.path("native").asText(),
                                node.path("mandarin").asText()));
                    }
                    topics.put(topic, new SheetTopic(topic, formulas, terms));
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load sheets", e);
        }
    }
}
