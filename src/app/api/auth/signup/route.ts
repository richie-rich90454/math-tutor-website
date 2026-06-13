import { NextRequest, NextResponse } from "next/server";
import { hashPassword, signToken } from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/db/users";
import { createSession } from "@/lib/db/sessions";
import { setSessionCookie } from "@/lib/auth-middleware";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: "Email, password, and name are required" },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        if (name.length < 2) {
            return NextResponse.json(
                { error: "Name must be at least 2 characters" },
                { status: 400 }
            );
        }

        const existing = getUserByEmail(email);
        if (existing) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        const userId = uuidv4();
        const passwordHash = hashPassword(password);
        const user = createUser(userId, email, name, passwordHash);

        const session = createSession(userId);
        const token = signToken({ sub: user.id, email: user.email });

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
            { status: 201 }
        );

        setSessionCookie(response, session.token);
        return response;
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { error: "Failed to create account" },
            { status: 500 }
        );
    }
}