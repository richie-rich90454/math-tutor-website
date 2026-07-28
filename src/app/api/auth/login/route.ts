import { NextRequest, NextResponse } from "next/server";
import { comparePassword, signToken } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db/users";
import { createSession, deleteUserSessions } from "@/lib/db/sessions";
import { setSessionCookie } from "@/lib/auth-middleware";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

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

        const { email, password, remember } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        if (typeof email !== "string" || typeof password !== "string") {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const sanitizedEmail = email.trim();
        const sanitizedPassword = password.trim();

        if (sanitizedEmail.length === 0 || sanitizedPassword.length === 0) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        if (sanitizedEmail.length > 255) {
            return NextResponse.json({ error: "Email is too long" }, { status: 400 });
        }

        if (sanitizedPassword.length > 128) {
            return NextResponse.json({ error: "Password is too long" }, { status: 400 });
        }

        const user = getUserByEmail(sanitizedEmail);
        if (!user) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        const valid = comparePassword(sanitizedPassword, user.password_hash);
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
