import { NextRequest, NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/auth-middleware";
import { deleteSession } from "@/lib/db/sessions";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession(request);
        if (session) {
            deleteSession(session.session.token);
        }

        const response = NextResponse.json({ success: true });
        clearSessionCookie(response);
        return response;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
    }
}
