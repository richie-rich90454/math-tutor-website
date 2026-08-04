package com.mathtutor.service;

import com.mathtutor.repo.AnswerCacheRepository;
import com.mathtutor.repo.ChatRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AnswerCache {

    private static final int MAX_ROWS = 20000;
    private static final int SCOPE_CHATS = 5;
    private static final int MIN_ANSWER_LENGTH = 40;
    private static final int MIN_QUESTION_LENGTH = 6;
    private static final int MAX_QUESTION_LENGTH = 300;
    private static final int MAX_NUMERIC_TOKENS = 2;
    private static final Pattern NUMERIC = Pattern.compile("\\d+");

    private final AnswerCacheRepository repo;
    private final ChatRepository chats;

    public AnswerCache(AnswerCacheRepository repo, ChatRepository chats) {
        this.repo = repo;
        this.chats = chats;
    }

    public Optional<String> lookup(String question, String language, String topic, String chatId, String userId) {
        String normalized = normalize(question);
        if (normalized.isEmpty()) {
            return Optional.empty();
        }
        Optional<AnswerCacheRepository.CacheRecord> hit =
                repo.findByKeyInChats(key(language, normalized), computeScope(chatId, userId));
        if (hit.isPresent()) {
            repo.incrementHit(hit.get().cache_key());
            repo.rehome(hit.get().cache_key(), chatId);
            return Optional.of(hit.get().answer());
        }
        return Optional.empty();
    }

    public void store(String question, String language, String topic, String answer, String chatId, String userId) {
        if (answer == null || answer.isBlank() || question == null || question.isBlank()) {
            return;
        }
        if (!shouldCache(question, answer)) {
            return;
        }
        String normalized = normalize(question);
        if (normalized.isEmpty()) {
            return;
        }
        String k = key(language, normalized);
        if (repo.findByKey(k).isEmpty()) {
            repo.put(k, question, language, topic, answer, chatId, userId);
        } else {
            repo.rehome(k, chatId);
        }
        repo.pruneExpired();
        repo.prune(MAX_ROWS);
    }

    // Cache only generic, reusable questions. Skip trivial or overly specific
    // computations whose replayed answer would look strange, but cache enough
    // concept/explanation questions to stay functional and save tokens.
    boolean shouldCache(String question, String answer) {
        String normalized = normalize(question);
        int len = normalized.length();
        if (len < MIN_QUESTION_LENGTH || len > MAX_QUESTION_LENGTH) {
            return false;
        }
        int numericTokens = 0;
        Matcher m = NUMERIC.matcher(normalized);
        while (m.find()) {
            numericTokens++;
        }
        if (numericTokens > MAX_NUMERIC_TOKENS) {
            return false;
        }
        return answer.trim().length() >= MIN_ANSWER_LENGTH;
    }

    // A cache hit may come from the current conversation plus the 5 most recent
    // conversations in the user's list (is_pinned DESC, updated_at DESC).
    private List<String> computeScope(String chatId, String userId) {
        List<String> scope = new ArrayList<>();
        if (chatId != null && !chatId.isBlank() && !scope.contains(chatId)) {
            scope.add(chatId);
        }
        for (String id : chats.findRecentChatIds(userId, SCOPE_CHATS)) {
            if (!scope.contains(id)) {
                scope.add(id);
            }
        }
        return scope;
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
