import { NextRequest, NextResponse } from "next/server";
import { comparePassword, signToken } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db/users";
import { createSession, deleteUserSessions } from "@/lib/db/sessions";
import { setSessionCookie } from "@/lib/auth-middleware";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators";
import { validateBody } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
    try {
        const ip =
            request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
        const rl = rateLimit(`login:${ip}`, 10, 60 * 1000);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: "Too many login attempts. Please wait." },
                {
                    status: 429,
                    headers: { ...getRateLimitHeaders(rl), "Retry-After": "60" },
                },
            );
        }

        const { data, error } = await validateBody(request, loginSchema);
        if (error) return error;

        const { email, password, remember } = data;

        const user = getUserByEmail(email);
        if (!user) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        const valid = comparePassword(password, user.password_hash);
        if (!valid) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        if (!remember) {
            deleteUserSessions(user.id);
        }

        const jwtToken = signToken({ sub: user.id, email: user.email });
        const session = createSession(user.id, jwtToken);

        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                preferred_language: user.preferred_language,
                math_level: user.math_level,
            },
        });

        setSessionCookie(response, session.token, !!remember);
        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
    }
}
