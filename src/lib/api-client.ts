// All API calls are same-origin through the Next.js server:
//  - JSON endpoints are proxied to the backend via next.config.ts rewrites
//  - streaming endpoints (/api/chat/message, /api/chat/image) are served by
//    Next.js route handlers that pipe the backend stream chunk by chunk
// Same-origin streaming is never buffered by the browser, so the UI shows
// the response incrementally (per character).

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
