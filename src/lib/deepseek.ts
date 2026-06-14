// DeepSeek API - captures both thinking (reasoning_content) and content
// Docs: https://platform.deepseek.com/api-docs

const API_KEY = process.env.OPENAI_COMPATIBLE_API_KEY;
const BASE_URL = process.env.OPENAI_COMPATIBLE_BASE_URL || "https://api.deepseek.com";
const MODEL = process.env.OPENAI_COMPATIBLE_MODEL || "deepseek-v4-flash";

export interface StreamChunk {
    type: "thinking" | "content";
    text: string;
}

export async function streamChatCompletion(
    messages: { role: string; content: string }[]
): Promise<ReadableStream<Uint8Array>> {
    if (!API_KEY) {
        throw new Error("API key not configured. Set OPENAI_COMPATIBLE_API_KEY in .env");
    }

    const url = `${BASE_URL}/chat/completions`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 5000,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText.slice(0, 300)}`);
    }

    if (!response.body) {
        throw new Error("No response body from API");
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
                    if (!trimmed.startsWith("data: ")) continue;

                    const data = trimmed.slice(6);
                    if (data === "[DONE]") {
                        controller.close();
                        return;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        const delta = parsed.choices?.[0]?.delta;
                        if (!delta) continue;

                        // Capture reasoning_content (thinking)
                        if (delta.reasoning_content) {
                            const chunk: StreamChunk = { type: "thinking", text: delta.reasoning_content };
                            controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk) + "\n"));
                        }

                        // Capture content (final answer)
                        if (delta.content) {
                            const chunk: StreamChunk = { type: "content", text: delta.content };
                            controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk) + "\n"));
                        }
                    } catch {
                        // Skip malformed JSON
                    }
                }
            } catch (err) {
                controller.error(err);
            }
        },
    });
}

export { MODEL };
