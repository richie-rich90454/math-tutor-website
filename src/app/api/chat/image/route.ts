import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8080"
).replace(/\/$/, "");

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    const body = await request.text();
    const cookie = request.headers.get("cookie") || "";

    const upstream = await fetch(`${BACKEND_URL}/api/chat/image`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(cookie ? { Cookie: cookie } : {}),
        },
        body,
        cache: "no-store",
    });

    if (!upstream.ok) {
        const text = await upstream.text();
        return new NextResponse(text, {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
        });
    }

    const chatId = upstream.headers.get("X-Chat-Id") || "";
    const reader = upstream.body?.getReader();

    const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
            if (!reader) {
                controller.close();
                return;
            }
            const { done, value } = await reader.read();
            if (done) {
                controller.close();
                return;
            }
            controller.enqueue(value);
        },
        cancel() {
            reader?.cancel().catch(() => {});
        },
    });

    return new Response(stream, {
        status: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            ...(chatId ? { "X-Chat-Id": chatId } : {}),
        },
    });
}
