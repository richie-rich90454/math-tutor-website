import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-middleware";
import { getUserChats, createChat } from "@/lib/db/chats";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession(request);
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const chats = getUserChats(session.user.id);
        return NextResponse.json({ chats });
    } catch (error) {
        console.error("Get chats error:", error);
        return NextResponse.json({ error: "Failed to get chats" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession(request);
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { title, preview } = await request.json();
        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const id = uuidv4();
        const chat = createChat(id, session.user.id, title, preview);
        return NextResponse.json({ chat }, { status: 201 });
    } catch (error) {
        console.error("Create chat error:", error);
        return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
    }
}