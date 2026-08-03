package com.mathtutor.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-account failed-login lockout with escalating lock windows. Complements the
 * existing per-IP rate limits in AuthController.
 */
@Service
public class AuthThrottleService {

    private static final int LOCK_THRESHOLD_1 = 5;
    private static final long LOCK_MS_1 = 15 * 60 * 1000L;
    private static final int LOCK_THRESHOLD_2 = 10;
    private static final long LOCK_MS_2 = 60 * 60 * 1000L;

    private final Map<String, Entry> store = new ConcurrentHashMap<>();

    private record Entry(int failures, long lockedUntil) {
    }

    public long lockRemainingMs(String email) {
        String key = email == null ? "" : email.toLowerCase();
        Entry entry = store.get(key);
        if (entry == null) {
            return 0;
        }
        long remaining = entry.lockedUntil() - System.currentTimeMillis();
        return remaining > 0 ? remaining : 0;
    }

    public boolean isLocked(String email) {
        return lockRemainingMs(email) > 0;
    }

    public void registerFailure(String email) {
        String key = email == null ? "" : email.toLowerCase();
        store.compute(key, (k, existing) -> {
            int failures = (existing == null ? 0 : existing.failures()) + 1;
            long lockedUntil = 0;
            if (failures >= LOCK_THRESHOLD_2) {
                lockedUntil = System.currentTimeMillis() + LOCK_MS_2;
            } else if (failures >= LOCK_THRESHOLD_1) {
                lockedUntil = System.currentTimeMillis() + LOCK_MS_1;
            }
            return new Entry(failures, lockedUntil);
        });
    }

    public void reset(String email) {
        String key = email == null ? "" : email.toLowerCase();
        store.remove(key);
    }
}
