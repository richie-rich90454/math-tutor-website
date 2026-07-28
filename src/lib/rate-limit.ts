interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

if (typeof globalThis !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store) {
            if (now > entry.resetAt) {
                store.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

export function rateLimit(
    key: string,
    maxRequests: number,
    windowMs: number,
): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        const newEntry: RateLimitEntry = {
            count: 1,
            resetAt: now + windowMs,
        };
        store.set(key, newEntry);
        return { allowed: true, remaining: maxRequests - 1, resetAt: newEntry.resetAt };
    }

    if (entry.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        "X-RateLimit-Limit": String(result.remaining + (result.allowed ? 1 : 0)),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.resetAt),
    };
}
