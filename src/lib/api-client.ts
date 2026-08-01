const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";

export function apiUrl(path: string): string {
    if (API_BASE_URL && path.startsWith("/api/")) {
        return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
    }
    return path;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    if (init?.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    return fetch(apiUrl(path), {
        ...init,
        headers,
        credentials: "include",
    });
}
