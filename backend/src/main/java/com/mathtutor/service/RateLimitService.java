package com.mathtutor.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private final Map<String, Entry> store = new ConcurrentHashMap<>();

    public record RateLimitResult(boolean allowed, int remaining, long resetAt) {
        public int limit() {
            return remaining() + (allowed() ? 1 : 0);
        }
    }

    private record Entry(int count, long resetAt) {
    }

    public RateLimitResult check(String key, int maxRequests, long windowMs) {
        long now = System.currentTimeMillis();
        Entry existing = store.get(key);

        if (existing == null || now > existing.resetAt()) {
            store.put(key, new Entry(1, now + windowMs));
            return new RateLimitResult(true, maxRequests - 1, now + windowMs);
        }

        if (existing.count() >= maxRequests) {
            return new RateLimitResult(false, 0, existing.resetAt());
        }

        store.put(key, new Entry(existing.count() + 1, existing.resetAt()));
        return new RateLimitResult(true, maxRequests - existing.count() - 1, existing.resetAt());
    }

    public Map<String, String> getHeaders(RateLimitResult result) {
        return Map.of(
                "X-RateLimit-Limit", String.valueOf(result.limit()),
                "X-RateLimit-Remaining", String.valueOf(result.remaining()),
                "X-RateLimit-Reset", String.valueOf(result.resetAt()));
    }

    @Scheduled(fixedDelay = 5 * 60 * 1000)
    public void cleanup() {
        long now = System.currentTimeMillis();
        store.entrySet().removeIf(entry -> now > entry.getValue().resetAt());
    }
}
