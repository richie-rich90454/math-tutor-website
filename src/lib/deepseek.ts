const OPENAI_COMPATIBLE_API_KEY = process.env.OPENAI_COMPATIBLE_API_KEY;
const OPENAI_COMPATIBLE_BASE_URL =
    process.env.OPENAI_COMPATIBLE_BASE_URL || "https://api.deepseek.com";
const MODEL = process.env.OPENAI_COMPATIBLE_MODEL || "deepseek-v4-flash";

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export async function streamChatCompletion(
    messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
    if (!OPENAI_COMPATIBLE_API_KEY) {
        throw new Error("DeepSeek API key is not configured");
    }

    const url = `${OPENAI_COMPATIBLE_BASE_URL}/chat/completions`;
    console.log("[DeepSeek] Calling:", url, "model:", MODEL);

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_COMPATIBLE_API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("[DeepSeek] Error response:", response.status, errorBody);
        let errorMsg = `DeepSeek API returned ${response.status}`;
        try {
            const errorJson = JSON.parse(errorBody);
            errorMsg = errorJson.error?.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
    }

    if (!response.body) {
        throw new Error("No response body from DeepSeek");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    return new ReadableStream({
        async pull(controller) {
            try {
                const { done, value } = await reader.read();
                if (done) {
                    controller.close();
                    return;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith("data: ")) continue;

                    const data = trimmed.slice(6);
                    if (data === "[DONE]") {
                        controller.close();
                        return;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            controller.enqueue(new TextEncoder().encode(content));
                        }
                    } catch {
                        // Skip malformed chunks
                    }
                }
            } catch (err) {
                controller.error(err);
            }
        },
    });
}

export { MODEL };
