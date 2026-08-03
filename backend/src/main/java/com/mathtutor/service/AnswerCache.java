package com.mathtutor.service;

import com.mathtutor.repo.AnswerCacheRepository;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class AnswerCache {

    private static final double SIMILARITY_THRESHOLD = 0.85;
    private static final int FUZZY_SCAN_LIMIT = 500;
    private static final int MAX_ROWS = 20000;

    private final AnswerCacheRepository repo;

    public AnswerCache(AnswerCacheRepository repo) {
        this.repo = repo;
    }

    public Optional<String> lookup(String question, String language, String topic) {
        String normalized = normalize(question);
        if (normalized.isEmpty()) {
            return Optional.empty();
        }
        Optional<AnswerCacheRepository.CacheRecord> exact = repo.findByKey(key(language, normalized));
        if (exact.isPresent()) {
            repo.incrementHit(exact.get().cache_key());
            return Optional.of(exact.get().answer());
        }
        Set<String> inputBigrams = bigrams(normalized);
        List<AnswerCacheRepository.CacheRecord> recent =
                repo.findRecentByLanguage(language, topic, FUZZY_SCAN_LIMIT);
        String best = null;
        double bestScore = SIMILARITY_THRESHOLD;
        for (AnswerCacheRepository.CacheRecord record : recent) {
            String candidate = normalize(record.question());
            double score = jaccard(inputBigrams, bigrams(candidate));
            if (score >= bestScore) {
                bestScore = score;
                best = record.answer();
            }
        }
        return Optional.ofNullable(best);
    }

    public void store(String question, String language, String topic, String answer) {
        if (answer == null || answer.isBlank() || question == null || question.isBlank()) {
            return;
        }
        String normalized = normalize(question);
        if (normalized.isEmpty()) {
            return;
        }
        String k = key(language, normalized);
        if (repo.findByKey(k).isEmpty()) {
            repo.put(k, question, language, topic, answer);
            repo.prune(MAX_ROWS);
        }
    }

    public String normalize(String value) {
        StringBuilder sb = new StringBuilder(value.length());
        for (char c : value.toLowerCase().toCharArray()) {
            if (Character.isLetterOrDigit(c)) {
                sb.append(c);
            } else {
                sb.append(' ');
            }
        }
        return sb.toString().replaceAll("\\s+", " ").trim();
    }

    private String key(String language, String normalized) {
        return language + ":" + normalized;
    }

    static Set<String> bigrams(String value) {
        Set<String> set = new HashSet<>();
        String trimmed = value.replace(" ", "");
        for (int i = 0; i + 1 < trimmed.length(); i++) {
            set.add(trimmed.substring(i, i + 2));
        }
        return set;
    }

    static double jaccard(Set<String> a, Set<String> b) {
        if (a.isEmpty() && b.isEmpty()) {
            return 1.0;
        }
        if (a.isEmpty() || b.isEmpty()) {
            return 0.0;
        }
        Set<String> intersection = new HashSet<>(a);
        intersection.retainAll(b);
        Set<String> union = new HashSet<>(a);
        union.addAll(b);
        return (double) intersection.size() / union.size();
    }
}
