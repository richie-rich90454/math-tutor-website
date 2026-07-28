import { NextRequest, NextResponse } from "next/server";
import { hashPassword, signToken } from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/db/users";
import { createSession } from "@/lib/db/sessions";
import { setSessionCookie } from "@/lib/auth-middleware";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { v4 as uuidv4 } from "uuid";
import { signupSchema } from "@/lib/validators";
import { validateBody } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
    try {
        const ip =
            request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
        const rl = rateLimit(`signup:${ip}`, 5, 60 * 1000);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: "Too many signup attempts. Please wait." },
                {
                    status: 429,
                    headers: { ...getRateLimitHeaders(rl), "Retry-After": "60" },
                },
            );
        }

        const { data, error } = await validateBody(request, signupSchema);
        if (error) return error;

        const { email, password, name } = data;

        const existing = getUserByEmail(email);
        if (existing) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 },
            );
        }

        const userId = uuidv4();
        const passwordHash = hashPassword(password);
        const user = createUser(userId, email, name, passwordHash);

        const jwtToken = signToken({ sub: user.id, email: user.email });
        const session = createSession(userId, jwtToken);

        const response = NextResponse.json(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    preferred_language: user.preferred_language,
                    math_level: user.math_level,
                },
            },
            { status: 201 },
        );

        setSessionCookie(response, session.token);
        return response;
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }
}
