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

        if (typeof email !== "string" || typeof password !== "string" || typeof name !== "string") {
            return NextResponse.json(
                { error: "Invalid input" },
                { status: 400 }
            );
        }

        const sanitizedEmail = email.trim();
        const sanitizedPassword = password.trim();
        const sanitizedName = name.trim();

        if (sanitizedEmail.length === 0 || sanitizedPassword.length === 0 || sanitizedName.length === 0) {
            return NextResponse.json(
                { error: "Email, password, and name are required" },
                { status: 400 }
            );
        }

        if (sanitizedEmail.length > 255) {
            return NextResponse.json({ error: "Email is too long" }, { status: 400 });
        }

        if (sanitizedPassword.length > 128) {
            return NextResponse.json({ error: "Password is too long" }, { status: 400 });
        }

        if (sanitizedName.length > 100) {
            return NextResponse.json({ error: "Name is too long" }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedEmail)) {
            return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }

        if (sanitizedPassword.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        if (sanitizedName.length < 2) {
            return NextResponse.json(
                { error: "Name must be at least 2 characters" },
                { status: 400 }
            );
        }

        const existing = getUserByEmail(sanitizedEmail);
        if (existing) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        const userId = uuidv4();
        const passwordHash = hashPassword(sanitizedPassword);
        const user = createUser(userId, sanitizedEmail, sanitizedName, passwordHash);

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