import { describe, it, expect, vi, afterEach } from "vitest";
import { apiFetch } from "@/lib/api-client";

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("apiFetch", () => {
    it("adds JSON content-type when a body is present without one", async () => {
        const fetchMock = vi.fn(() => Promise.resolve(new Response("{}", { status: 200 })));
        vi.stubGlobal("fetch", fetchMock);

        await apiFetch("/api/x", { method: "POST", body: "{}" });

        expect(fetchMock).toHaveBeenCalledWith("/api/x", expect.any(Object));
        const headers = fetchMock.mock.calls[0][1].headers as Headers;
        expect(headers.get("Content-Type")).toBe("application/json");
    });

    it("keeps an existing content-type header", async () => {
        const fetchMock = vi.fn(() => Promise.resolve(new Response("{}", { status: 200 })));
        vi.stubGlobal("fetch", fetchMock);

        await apiFetch("/api/x", {
            method: "POST",
            body: "data",
            headers: { "Content-Type": "text/plain" },
        });

        const headers = fetchMock.mock.calls[0][1].headers as Headers;
        expect(headers.get("Content-Type")).toBe("text/plain");
    });

    it("does not add content-type when there is no body", async () => {
        const fetchMock = vi.fn(() => Promise.resolve(new Response("{}", { status: 200 })));
        vi.stubGlobal("fetch", fetchMock);

        await apiFetch("/api/x");

        const headers = fetchMock.mock.calls[0][1].headers as Headers;
        expect(headers.has("Content-Type")).toBe(false);
    });

    it("passes through method and path", async () => {
        const fetchMock = vi.fn(() => Promise.resolve(new Response("{}", { status: 200 })));
        vi.stubGlobal("fetch", fetchMock);

        await apiFetch("/api/y", { method: "DELETE" });

        expect(fetchMock).toHaveBeenCalledWith("/api/y", expect.objectContaining({ method: "DELETE" }));
    });

    it("returns the underlying response", async () => {
        const response = new Response("ok", { status: 204 });
        vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response)));

        const result = await apiFetch("/api/z");
        expect(result).toBe(response);
        expect(result.status).toBe(204);
    });
});
