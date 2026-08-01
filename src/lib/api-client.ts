// All regular API calls are same-origin through the Next.js server:
//  - JSON endpoints are proxied to the backend via next.config.ts rewrites
// Streaming endpoints call the Spring Boot backend directly using a Bearer
// token with credentials: "omit". The browser streams cross-origin responses
// without credentials; the same request WITH credentials would be buffered by
// the browser, which would destroy per-character streaming.

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8080";

let sessionToken: string | null = null;

export function setSessionToken(token: string | null) {
    sessionToken = token;
}

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

export function apiStreamUrl(path: string): string {
    if (API_BASE_URL && path.startsWith("/api/")) {
        return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
    }
    return path;
}

export function apiStreamFetch(path: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    if (init?.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    if (sessionToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${sessionToken}`);
    }
    return fetch(apiStreamUrl(path), {
        ...init,
        headers,
        credentials: "omit",
    });
}
