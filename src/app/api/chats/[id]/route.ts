import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-middleware";
import { getChatById, updateChat, deleteChat } from "@/lib/db/chats";
import { getChatMessages } from "@/lib/db/messages";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession(request);
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { id } = await params;
        const chat = getChatById(id);
        if (!chat) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }

        if (chat.user_id !== session.user.id) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const messages = getChatMessages(id);
        return NextResponse.json({ chat, messages });
    } catch (error) {
        console.error("Get chat error:", error);
        return NextResponse.json({ error: "Failed to get chat" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession(request);
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { id } = await params;
        const chat = getChatById(id);
        if (!chat) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }

        if (chat.user_id !== session.user.id) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const body = await request.json();
        updateChat(id, body);
        const updated = getChatById(id);
        return NextResponse.json({ chat: updated });
    } catch (error) {
        console.error("Update chat error:", error);
        return NextResponse.json({ error: "Failed to update chat" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await getSession(request);
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { id } = await params;
        const chat = getChatById(id);
        if (!chat) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }

        if (chat.user_id !== session.user.id) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        deleteChat(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete chat error:", error);
        return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 });
    }
}
