// JSON endpoints are proxied same-origin through the Next.js server
// (see next.config.ts rewrites) so the browser stays on one origin.
// Streaming endpoints (chat message/image) MUST bypass the proxy: the
// rewrite buffers the whole response, which destroys streaming. They
// call the backend directly; CORS is configured on the backend and the
// session cookie is host-scoped (localhost), so it is sent on both ports.

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";

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
    return fetch(apiStreamUrl(path), {
        ...init,
        headers,
        credentials: "include",
    });
}
