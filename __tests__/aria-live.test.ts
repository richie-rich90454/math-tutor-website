import { describe, it, expect, vi, afterEach } from "vitest";
import { announcePolite, announceAssertive } from "@/lib/aria-live";

function makeEl() {
    return { textContent: "" };
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("announcePolite / announceAssertive", () => {
    it("announces politely by clearing then setting the message", () => {
        const el = makeEl();
        vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
            cb();
            return 1;
        });
        vi.stubGlobal("document", { getElementById: vi.fn(() => el) });

        announcePolite("New message");

        expect(el.textContent).toBe("New message");
    });

    it("announces assertively", () => {
        const el = makeEl();
        vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
            cb();
            return 1;
        });
        vi.stubGlobal("document", { getElementById: vi.fn(() => el) });

        announceAssertive("Alert!");

        expect(el.textContent).toBe("Alert!");
    });

    it("uses requestAnimationFrame for the final message", () => {
        const el = makeEl();
        let rAF: (() => void) | null = null;
        vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
            rAF = cb;
            return 1;
        });
        vi.stubGlobal("document", { getElementById: vi.fn(() => el) });

        announcePolite("Later");
        expect(el.textContent).toBe("");
        expect(rAF).not.toBeNull();
        rAF!();
        expect(el.textContent).toBe("Later");
    });

    it("is a no-op when the target element is missing", () => {
        vi.stubGlobal("requestAnimationFrame", (cb: () => void) => cb());
        vi.stubGlobal("document", { getElementById: vi.fn(() => null) });

        expect(() => announcePolite("x")).not.toThrow();
        expect(() => announceAssertive("y")).not.toThrow();
    });
});
