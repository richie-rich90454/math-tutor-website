// Manual ReadableStream pipe: reads the backend stream chunk by chunk and
// enqueues each chunk to the client, matching the original monolith route
// that streamed per character. Same-origin so the browser never buffers.
const BACKEND_URL = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8080"
).replace(/\/$/, "");

export async function POST(request: Request) {
    const body = await request.text();
    const cookie = request.headers.get("cookie") || "";

    const upstream = await fetch(`${BACKEND_URL}/api/chat/message`, {
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
        return new Response(text, {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
        });
    }

    const chatId = upstream.headers.get("X-Chat-Id") || "";
    const reader = upstream.body!.getReader();

    const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
            try {
                const { done, value } = await reader.read();
                if (done) {
                    controller.close();
                    return;
                }
                controller.enqueue(value);
            } catch (err) {
                controller.error(err);
            }
        },
        cancel() {
            reader.cancel().catch(() => {});
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
