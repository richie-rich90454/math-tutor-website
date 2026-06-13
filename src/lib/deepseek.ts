const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL =
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
const MODEL = "deepseek-v4-flash";

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export async function streamChatCompletion(
    messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
    if (!DEEPSEEK_API_KEY) {
        throw new Error("DeepSeek API key is not configured");
    }

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 4096,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
            (error as any).error?.message || `DeepSeek API returned ${response.status}`
        );
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