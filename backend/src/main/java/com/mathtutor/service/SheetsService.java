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
    // translations: English term -> (language -> localized term)
    private final Map<String, Map<String, String>> translations = new LinkedHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Languages that display the Mandarin field directly (Chinese variants and the
    // China-minority packs whose education language is Mandarin).
    private static final java.util.Set<String> MANDARIN_BASED = java.util.Set.of(
            "zh-hans", "zh-hant", "bca", "dng", "hni", "iom", "lic", "lhu", "lis",
            "nxq", "pcc", "tdd", "tji", "wbm", "yi", "za");

    public SheetsService() {
        loadAll();
        loadTranslations();
    }

    public record Formula(String name, String formula, String nativeTerm, String mandarin) {
    }

    public record Term(String term, String nativeTerm, String mandarin) {
    }

    public record SheetTopic(String topic, List<Formula> formulas, List<Term> terms) {
    }

    public Optional<SheetTopic> get(String topic) {
        return get(topic, null);
    }

    public Optional<SheetTopic> get(String topic, String language) {
        if (topic == null || topic.isBlank()) {
            return Optional.empty();
        }
        SheetTopic sheet = topics.get(topic.toLowerCase());
        return Optional.ofNullable(localize(sheet, language));
    }

    public List<SheetTopic> all() {
        return all(null);
    }

    public List<SheetTopic> all(String language) {
        List<SheetTopic> out = new ArrayList<>();
        for (SheetTopic t : topics.values()) {
            out.add(localize(t, language));
        }
        return out;
    }

    private String localize(String english, String mandarin, String language) {
        if (language == null || language.isBlank()) {
            return english;
        }
        Map<String, String> byLang = translations.get(english);
        if (byLang != null) {
            String value = byLang.get(language);
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        if (MANDARIN_BASED.contains(language) && mandarin != null && !mandarin.isBlank()) {
            return mandarin;
        }
        return english;
    }

    private SheetTopic localize(SheetTopic sheet, String language) {
        if (sheet == null || language == null || language.isBlank()) {
            return sheet;
        }
        List<Formula> formulas = new ArrayList<>();
        for (Formula f : sheet.formulas()) {
            formulas.add(new Formula(localize(f.name(), f.mandarin(), language), f.formula(),
                    f.nativeTerm(), f.mandarin()));
        }
        List<Term> terms = new ArrayList<>();
        for (Term t : sheet.terms()) {
            terms.add(new Term(localize(t.term(), t.mandarin(), language), t.nativeTerm(),
                    t.mandarin()));
        }
        return new SheetTopic(sheet.topic(), formulas, terms);
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

    private void loadTranslations() {
        try {
            Resource[] resources = new PathMatchingResourcePatternResolver()
                    .getResources("classpath*:sheets/translations.json");
            if (resources.length == 0) {
                return;
            }
            try (InputStream in = resources[0].getInputStream()) {
                JsonNode root = objectMapper.readTree(in);
                var fields = root.properties();
                for (var entry : fields) {
                    String english = entry.getKey();
                    Map<String, String> byLang = new LinkedHashMap<>();
                    var langFields = entry.getValue().properties();
                    for (var lf : langFields) {
                        byLang.put(lf.getKey(), lf.getValue().asString());
                    }
                    translations.put(english, byLang);
                }
            }
        } catch (IOException e) {
            // Translations are optional; fall back to English/Mandarin.
        }
    }

    private void loadAll() {
        try {
            Resource[] resources = new PathMatchingResourcePatternResolver()
                    .getResources("classpath*:sheets/*.json");
            for (Resource resource : resources) {
                try (InputStream in = resource.getInputStream()) {
                    JsonNode root = objectMapper.readTree(in);
                    String topic = root.path("topic").asString().toLowerCase();
                    List<Formula> formulas = new ArrayList<>();
                    for (JsonNode node : root.path("formulas")) {
                        formulas.add(new Formula(
                                node.path("name").asString(),
                                node.path("formula").asString(),
                                node.path("native").asString(),
                                node.path("mandarin").asString()));
                    }
                    List<Term> terms = new ArrayList<>();
                    for (JsonNode node : root.path("terms")) {
                        terms.add(new Term(
                                node.path("term").asString(),
                                node.path("native").asString(),
                                node.path("mandarin").asString()));
                    }
                    topics.put(topic, new SheetTopic(topic, formulas, terms));
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load sheets", e);
        }
    }
}
