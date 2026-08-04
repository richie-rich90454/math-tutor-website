import { describe, it, expect, vi, afterEach } from "vitest";
import { createHmac } from "crypto";
import { hashPassword, comparePassword, signToken, verifyToken } from "@/lib/auth";

const secret = process.env.SESSION_SECRET!;

function signedToken(payload: Record<string, unknown>, useSecret: string): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = createHmac("sha256", useSecret).update(`${header}.${body}`).digest("base64url");
    return `${header}.${body}.${sig}`;
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe("signToken / verifyToken edge cases", () => {
    it("throws when SESSION_SECRET is missing or empty", () => {
        vi.stubEnv("SESSION_SECRET", "");
        expect(() => signToken({})).toThrow(/SESSION_SECRET/);
    });

    it("rejects tokens without exactly three parts", () => {
        expect(verifyToken("onepart")).toBeNull();
        expect(verifyToken("a.b.c.d")).toBeNull();
    });

    it("rejects a token signed with the wrong secret", () => {
        const token = signedToken({ sub: "x" }, "some-other-secret");
        expect(verifyToken(token)).toBeNull();
    });

    it("rejects an expired token that has a valid signature", () => {
        const token = signedToken(
            {
                sub: "x",
                iat: Math.floor(Date.now() / 1000) - 2000,
                exp: Math.floor(Date.now() / 1000) - 1000,
            },
            secret,
        );
        expect(verifyToken(token)).toBeNull();
    });

    it("accepts a future-expiry token and returns the payload", () => {
        const payload = verifyToken(signToken({ sub: "u", n: 5 }));
        expect(payload?.sub).toBe("u");
        expect(payload?.n).toBe(5);
        expect(payload?.exp).toBeGreaterThan(Date.now() / 1000);
    });

    it("returns null when the payload body cannot be parsed", () => {
        const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
            "base64url",
        );
        const badBody = Buffer.from("{ not-json").toString("base64url");
        const sig = createHmac("sha256", secret).update(`${header}.${badBody}`).digest("base64url");
        expect(verifyToken(`${header}.${badBody}.${sig}`)).toBeNull();
    });

    it("returns null for completely malformed input", () => {
        expect(verifyToken("")).toBeNull();
        expect(verifyToken("....")).toBeNull();
    });
});

describe("comparePassword edge cases", () => {
    it("returns false (not throw) for a short 2-part hash", () => {
        expect(comparePassword("x", "salt:short")).toBe(false);
    });

    it("returns false (not throw) for a short 4-part hash", () => {
        expect(comparePassword("x", "salt:100000:32:abc")).toBe(false);
    });

    it("returns false for empty salt or hash", () => {
        expect(comparePassword("x", ":hash")).toBe(false);
        expect(comparePassword("x", "salt:")).toBe(false);
    });

    it("returns false for non-numeric iterations or keylen", () => {
        const digest = "d".repeat(64);
        expect(comparePassword("x", `salt:abc:32:${digest}`)).toBe(false);
        expect(comparePassword("x", `salt:100000:xyz:${digest}`)).toBe(false);
        expect(comparePassword("x", `salt:0:32:${digest}`)).toBe(false);
    });

    it("round-trips a pbkdf2 hash", () => {
        const h = hashPassword("pw");
        expect(comparePassword("pw", h)).toBe(true);
        expect(comparePassword("nope", h)).toBe(false);
    });
});
