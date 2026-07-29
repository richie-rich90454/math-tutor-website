import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession(request);
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        return NextResponse.json({ user: session.user });
    } catch (error) {
        console.error("Auth me error:", error);
        return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
    }
}
