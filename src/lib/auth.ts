import { createHash, createHmac, timingSafeEqual, randomBytes } from "crypto";

const JWT_SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const hash = createHash("sha256")
        .update(password + salt)
        .digest("hex");
    return `${salt}:${hash}`;
}

export function comparePassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const computed = createHash("sha256")
        .update(password + salt)
        .digest("hex");
    return computed === hash;
}

export function signToken(payload: Record<string, unknown>): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
        "base64url"
    );

    const body = Buffer.from(
        JSON.stringify({
            ...payload,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN_SECONDS,
        })
    ).toString("base64url");

    const hmac = createHmac("sha256", JWT_SECRET);
    hmac.update(`${header}.${body}`);
    const signature = hmac.digest("base64url");

    return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const [header, body, signature] = parts;

        const hmac = createHmac("sha256", JWT_SECRET);
        hmac.update(`${header}.${body}`);
        const expected = hmac.digest("base64url");

        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);

        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
            return null;
        }

        const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Record<
            string,
            unknown
        >;

        if (typeof payload.exp === "number" && payload.exp < Date.now() / 1000) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}