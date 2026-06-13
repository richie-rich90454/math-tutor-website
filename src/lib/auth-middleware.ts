import { NextRequest } from "next/server";
import { verifyToken } from "./auth";
import { getSessionByToken, cleanupExpiredSessions } from "./db/sessions";
import { getUserById } from "./db/users";

export interface SessionUser {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    preferred_language: string;
    math_level: string;
}

export interface SessionData {
    user: SessionUser;
    session: {
        id: string;
        token: string;
        expires_at: string;
    };
}

export async function getSession(request: NextRequest): Promise<SessionData | null> {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    const userId = payload.sub as string;
    if (!userId) return null;

    try {
        const dbSession = getSessionByToken(token);
        if (!dbSession) return null;

        if (new Date(dbSession.expires_at) < new Date()) {
            return null;
        }

        const user = getUserById(userId);
        if (!user) return null;

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url,
                preferred_language: user.preferred_language,
                math_level: user.math_level,
            },
            session: {
                id: dbSession.id,
                token: dbSession.token,
                expires_at: dbSession.expires_at,
            },
        };
    } catch {
        return null;
    }
}

export function setSessionCookie(response: Response, token: string, remember: boolean = false): void {
    const maxAge = remember ? 2592000 : 86400; // 30 days or 24 hours
    response.headers.set(
        "Set-Cookie",
        `session_token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${
            process.env.NODE_ENV === "production" ? "; Secure" : ""
        }`
    );
}

export function clearSessionCookie(response: Response): void {
    response.headers.set(
        "Set-Cookie",
        "session_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
    );
}