package com.mathtutor.service;

import com.mathtutor.config.AppProperties;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PromptService {

    private static final Map<String, String> LANGUAGE_FILE_MAP = Map.ofEntries(
            Map.entry("zh", "prompt-zh-hant.txt"),
            Map.entry("zh-hans", "prompt-zh-hans.txt"),
            Map.entry("zh-hant", "prompt-zh-hant.txt"),
            Map.entry("bo", "prompt-bo.txt"),
            Map.entry("mn-cyrl", "prompt-mn-cyrl.txt"),
            Map.entry("mn-mong", "prompt-mn-mong.txt"),
            Map.entry("es", "prompt-es.txt"),
            Map.entry("fr", "prompt-fr.txt"),
            Map.entry("de", "prompt-de.txt"),
            Map.entry("ja", "prompt-ja.txt"),
            Map.entry("kk", "prompt-kk.txt"),
            Map.entry("ug", "prompt-ug.txt"),
            Map.entry("ko", "prompt-ko.txt"),
            Map.entry("za", "prompt-za.txt"),
            Map.entry("ru", "prompt-ru.txt"),
            Map.entry("yi", "prompt-yi.txt"),
            Map.entry("tg", "prompt-tg.txt"),
            Map.entry("vi", "prompt-vi.txt"),
            Map.entry("uz", "prompt-uz.txt"),
            Map.entry("ky", "prompt-ky.txt"),
            Map.entry("hmn", "prompt-hmn.txt"),
            Map.entry("dng", "prompt-dng.txt"),
            Map.entry("bca", "prompt-bca.txt"),
            Map.entry("tdd", "prompt-tdd.txt"),
            Map.entry("nxq", "prompt-nxq.txt"),
            Map.entry("tji", "prompt-tji.txt"),
            Map.entry("pcc", "prompt-pcc.txt"),
            Map.entry("hni", "prompt-hni.txt"),
            Map.entry("lic", "prompt-lic.txt"),
            Map.entry("iom", "prompt-iom.txt"),
            Map.entry("lis", "prompt-lis.txt"),
            Map.entry("lhu", "prompt-lhu.txt"),
            Map.entry("wbm", "prompt-wbm.txt"),
            Map.entry("en", "prompt-en-us.txt"));

    private static final String FALLBACK_PROMPT =
            "You are a friendly, patient math tutor. Explain math concepts clearly using LaTeX for formulas.\n" +
                    "Use step-by-step reasoning. Break down complex problems. Be encouraging and positive.\n" +
                    "Format inline math with $...$ and display math with $$...$$.";

    private final AppProperties props;
    private final Map<String, String> cache = new ConcurrentHashMap<>();

    public PromptService(AppProperties props) {
        this.props = props;
    }

    public String getSystemPrompt(String language) {
        String normalized = language == null || language.isBlank() ? "en" : language;
        String cached = cache.get(normalized);
        if (cached != null) {
            return cached;
        }

        String fileName = LANGUAGE_FILE_MAP.getOrDefault(normalized, "prompt-en-us.txt");
        String dir = props.prompts().classpathDir();
        try {
            ClassPathResource resource = new ClassPathResource(dir + "/" + fileName);
            if (resource.exists()) {
                String content = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                cache.put(normalized, content);
                return content;
            }
        } catch (IOException e) {
            // fall through to fallback prompt
        }
        cache.put(normalized, FALLBACK_PROMPT);
        return FALLBACK_PROMPT;
    }
}
