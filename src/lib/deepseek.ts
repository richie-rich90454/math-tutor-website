// DeepSeek API Configuration
// Docs: https://platform.deepseek.com/api-docs

const API_KEY = process.env.OPENAI_COMPATIBLE_API_KEY;
const BASE_URL = process.env.OPENAI_COMPATIBLE_BASE_URL || "https://api.deepseek.com";
const MODEL = process.env.OPENAI_COMPATIBLE_MODEL || "deepseek-v4-flash";

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export async function streamChatCompletion(
    messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
    if (!API_KEY) {
        throw new Error("API key not configured. Set OPENAI_COMPATIBLE_API_KEY in .env");
    }

    const url = `${BASE_URL}/chat/completions`;

    console.log("[API] Request:", { url, model: MODEL, messageCount: messages.length });

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

    console.log("[API] Response status:", response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("[API] Error:", response.status, errorText);
        throw new Error(`API error ${response.status}: ${errorText.slice(0, 200)}`);
    }

    if (!response.body) {
        throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    return new ReadableStream({
        async pull(controller) {
            try {
                const { done, value } = await reader.read();
                if (done) {
                    console.log("[API] Stream complete");
                    controller.close();
                    return;
                }

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith("data: ")) continue;

                    const data = trimmed.slice(6);
                    if (data === "[DONE]") {
                        console.log("[API] Received [DONE]");
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
                        // Skip malformed JSON
                    }
                }
            } catch (err) {
                console.error("[API] Stream error:", err);
                controller.error(err);
            }
        },
    });
}

export { MODEL };
