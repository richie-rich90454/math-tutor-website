import { NextRequest, NextResponse } from "next/server";
import { comparePassword, signToken } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db/users";
import { createSession, deleteUserSessions } from "@/lib/db/sessions";
import { setSessionCookie } from "@/lib/auth-middleware";

export async function POST(request: NextRequest) {
    try {
        const { email, password, remember } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const user = getUserByEmail(email);
        if (!user) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        const valid = comparePassword(password, user.password_hash);
        if (!valid) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        if (remember) {
            deleteUserSessions(user.id);
        }

        const session = createSession(user.id);

        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                preferred_language: user.preferred_language,
                math_level: user.math_level,
            },
        });

        setSessionCookie(response, session.token);
        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Failed to sign in" },
            { status: 500 }
        );
    }
}