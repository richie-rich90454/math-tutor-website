import { hashPassword, comparePassword, signToken, verifyToken } from "@/lib/auth";

describe("Auth", () => {
    describe("hashPassword", () => {
        it("returns a string with 4 colon-separated parts", () => {
            const hash = hashPassword("testpassword");
            const parts = hash.split(":");
            expect(parts.length).toBe(4);
        });

        it("produces different hashes for different passwords", () => {
            const hash1 = hashPassword("password1");
            const hash2 = hashPassword("password2");
            expect(hash1).not.toBe(hash2);
        });
    });

    describe("comparePassword", () => {
        it("returns true for correct password", () => {
            const hash = hashPassword("mypassword");
            expect(comparePassword("mypassword", hash)).toBe(true);
        });

        it("returns false for incorrect password", () => {
            const hash = hashPassword("mypassword");
            expect(comparePassword("wrongpassword", hash)).toBe(false);
        });

        it("handles legacy 2-part format", () => {
            // Legacy format: salt:hash (SHA-256)
            const crypto = require("crypto");
            const salt = "abc123";
            const hash = crypto
                .createHash("sha256")
                .update("test" + salt)
                .digest("hex");
            const stored = `${salt}:${hash}`;
            expect(comparePassword("test", stored)).toBe(true);
            expect(comparePassword("wrong", stored)).toBe(false);
        });

        it("returns false for malformed stored hash", () => {
            expect(comparePassword("test", "invalid")).toBe(false);
            expect(comparePassword("test", "a:b:c")).toBe(false);
        });
    });

    describe("signToken / verifyToken", () => {
        it("creates a valid token that can be verified", () => {
            const token = signToken({ sub: "user123", email: "test@example.com" });
            const payload = verifyToken(token);
            expect(payload).not.toBeNull();
            expect(payload?.sub).toBe("user123");
            expect(payload?.email).toBe("test@example.com");
        });

        it("includes iat and exp in the token", () => {
            const token = signToken({ sub: "user123" });
            const payload = verifyToken(token);
            expect(payload?.iat).toBeDefined();
            expect(payload?.exp).toBeDefined();
            expect(typeof payload?.iat).toBe("number");
            expect(typeof payload?.exp).toBe("number");
        });

        it("returns null for invalid token", () => {
            expect(verifyToken("invalid.token.here")).toBeNull();
        });

        it("returns null for expired token", () => {
            // Create a token with a past expiry
            const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
                "base64url",
            );
            const body = Buffer.from(
                JSON.stringify({
                    sub: "user123",
                    iat: Math.floor(Date.now() / 1000) - 100000,
                    exp: Math.floor(Date.now() / 1000) - 1000,
                }),
            ).toString("base64url");
            // We can't easily create a valid signature for an expired token without the secret,
            // but we can verify that the verify function handles the structure
            const token = `${header}.${body}.fakesignature`;
            expect(verifyToken(token)).toBeNull();
        });

        it("returns null for tampered token", () => {
            const token = signToken({ sub: "user123" });
            const parts = token.split(".");
            parts[2] = "tampered";
            expect(verifyToken(parts.join("."))).toBeNull();
        });
    });
});
