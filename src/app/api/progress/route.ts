import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession(request);
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const db = getDb();

        const totalChats = db
            .prepare("SELECT COUNT(*) as count FROM chat_sessions WHERE user_id = ?")
            .get(session.user.id) as { count: number };

        const totalMessages = db
            .prepare(
                `
            SELECT COUNT(*) as count FROM chat_messages cm
            JOIN chat_sessions cs ON cm.chat_session_id = cs.id
            WHERE cs.user_id = ?
        `,
            )
            .get(session.user.id) as { count: number };

        const topics = db
            .prepare(
                `
            SELECT topic, COUNT(*) as count
            FROM chat_sessions
            WHERE user_id = ? AND topic IS NOT NULL AND topic != ''
            GROUP BY topic
            ORDER BY count DESC
        `,
            )
            .all(session.user.id) as { topic: string; count: number }[];

        const recentChats = db
            .prepare(
                `
            SELECT id, title, topic, created_at
            FROM chat_sessions
            WHERE user_id = ?
            ORDER BY updated_at DESC
            LIMIT 10
        `,
            )
            .all(session.user.id) as {
            id: string;
            title: string;
            topic: string | null;
            created_at: string;
        }[];

        const dailyActivity = db
            .prepare(
                `
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM chat_sessions
            WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `,
            )
            .all(session.user.id) as { date: string; count: number }[];

        const firstChat = db
            .prepare(
                "SELECT created_at FROM chat_sessions WHERE user_id = ? ORDER BY created_at ASC LIMIT 1",
            )
            .get(session.user.id) as { created_at: string } | undefined;

        const longestStreak = calculateStreak(dailyActivity);

        return NextResponse.json({
            totalChats: totalChats.count,
            totalMessages: totalMessages.count,
            topics,
            recentChats,
            dailyActivity,
            memberSince: firstChat?.created_at || null,
            longestStreak,
        });
    } catch (error) {
        console.error("Progress API error:", error);
        return NextResponse.json({ error: "Failed to get progress" }, { status: 500 });
    }
}

function calculateStreak(dailyActivity: { date: string; count: number }[]): number {
    if (dailyActivity.length === 0) return 0;

    const dates = new Set(dailyActivity.map((d) => d.date));
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        if (dates.has(dateStr)) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }

    return streak;
}
