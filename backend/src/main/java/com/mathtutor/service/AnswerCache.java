package com.mathtutor.service;

import com.mathtutor.repo.AnswerCacheRepository;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
public class AnswerCache {

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
        return Optional.empty();
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
