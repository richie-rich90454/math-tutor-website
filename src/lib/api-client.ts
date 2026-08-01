// The Next.js server proxies /api/* and /legacy/* to the Spring Boot
// backend (see next.config.ts rewrites), so the browser always talks to
// the same origin — no CORS, matching the original monolith behavior.

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    if (init?.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    return fetch(path, {
        ...init,
        headers,
    });
}
