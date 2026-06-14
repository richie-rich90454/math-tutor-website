import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-middleware";
import { addMessage, getRecentMessages } from "@/lib/db/messages";
import { createChat, updateChat } from "@/lib/db/chats";
import { logUsage } from "@/lib/db/usage";
import { v4 as uuidv4 } from "uuid";

const VISION_MODEL = process.env.OPENAI_COMPATIBLE_VISION_MODEL || process.env.OPENAI_COMPATIBLE_MODEL || "deepseek-v4-flash";
const API_KEY = process.env.OPENAI_COMPATIBLE_API_KEY;
const BASE_URL = process.env.OPENAI_COMPATIBLE_BASE_URL || "https://api.deepseek.com";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession(request);
        if (!session) {
            return NextResponse.json({ error: "Please sign in to chat" }, { status: 401 });
        }

        if (!API_KEY) {
            return NextResponse.json({ error: "Vision API not configured" }, { status: 500 });
        }

        const { image, mimeType, message, chatId, preferredLanguage } = await request.json();
        if (!image) {
            return NextResponse.json({ error: "Image is required" }, { status: 400 });
        }

        let activeChatId = chatId;
        const userText = message || "Please analyze this image and solve any math problem you see. Show your work step by step.";

        const userMsgId = uuidv4();
        if (activeChatId) {
            addMessage(userMsgId, activeChatId, "user", `[Image] ${userText}`, 0);
            updateChat(activeChatId, { preview: userText.slice(0, 100) });
        } else {
            activeChatId = uuidv4();
            const title = userText.slice(0, 50) + (userText.length > 50 ? "..." : "");
            createChat(activeChatId, session.user.id, title, userText.slice(0, 100));
            addMessage(userMsgId, activeChatId, "user", `[Image] ${userText}`, 0);
        }

        const contextMessages: { role: "system" | "user" | "assistant"; content: string | any[] }[] = [
            {
                role: "system",
                content: "You are an expert math tutor. The user has shared an image containing a math problem. Analyze the image carefully, identify the math problem, and solve it step by step. Use LaTeX for all mathematical expressions. Be clear and thorough.",
            },
        ];

        if (activeChatId) {
            const history = getRecentMessages(activeChatId, 20);
            for (const msg of history) {
                contextMessages.push({
                    role: msg.role as "user" | "assistant",
                    content: msg.content,
                });
            }
        }

        contextMessages.push({
            role: "user",
            content: [
                { type: "text", text: userText },
                { type: "image_url", image_url: { url: image } },
            ],
        });

        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: VISION_MODEL,
                messages: contextMessages,
                stream: true,
                temperature: 0.7,
                max_tokens: 4096,
            }),
            signal: AbortSignal.timeout(120_000),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error((error as any).error?.message || `Vision API returned ${response.status}`);
        }

        if (!response.body) {
            throw new Error("No response body from Vision API");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        let fullThinking = "";

        const responseStream = new ReadableStream({
            async pull(controller) {
                try {
                    const { done, value } = await reader.read();
                    if (done) {
                        const assistantMsgId = uuidv4();
                        addMessage(assistantMsgId, activeChatId!, "assistant", fullContent || fullThinking, 0);
                        logUsage(assistantMsgId, session.user.id, activeChatId!, 0, 0);
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
                            const assistantMsgId = uuidv4();
                            addMessage(assistantMsgId, activeChatId!, "assistant", fullContent || fullThinking, 0);
                            logUsage(assistantMsgId, session.user.id, activeChatId!, 0, 0);
                            controller.close();
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices?.[0]?.delta;
                            if (!delta) continue;
                            if (delta.reasoning_content) {
                                fullThinking += delta.reasoning_content;
                                controller.enqueue(new TextEncoder().encode(JSON.stringify({ type: "thinking", text: delta.reasoning_content }) + "\n"));
                            }
                            if (delta.content) {
                                fullContent += delta.content;
                                controller.enqueue(new TextEncoder().encode(JSON.stringify({ type: "content", text: delta.content }) + "\n"));
                            }
                        } catch {}
                    }
                } catch (err) {
                    controller.error(err);
                }
            },
        });

        return new Response(responseStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                "X-Accel-Buffering": "no",
                "X-Chat-Id": activeChatId,
            },
        });
    } catch (error: any) {
        console.error("Vision API error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to analyze image" },
            { status: 500 }
        );
    }
}
