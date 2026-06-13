import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-middleware";
import { streamChatCompletion } from "@/lib/deepseek";
import { addMessage } from "@/lib/db/messages";
import { createChat, updateChat } from "@/lib/db/chats";
import { logUsage } from "@/lib/db/usage";
import { v4 as uuidv4 } from "uuid";
import { promises as fs } from "fs";
import path from "path";

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return { allowed: true, remaining: RATE_LIMIT - 1, resetAt: now + RATE_WINDOW_MS };
    }

    entry.count++;
    if (entry.count > RATE_LIMIT) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    return { allowed: true, remaining: RATE_LIMIT - entry.count, resetAt: entry.resetAt };
}

const systemPromptCache = new Map<string, string>();

async function getSystemPrompt(language: string): Promise<string> {
    const cached = systemPromptCache.get(language);
    if (cached) return cached;

    let fileName: string;
    switch (language) {
        case "zh":
            fileName = "prompt-zh-hant.txt";
        case "zh-hans":
            fileName = "prompt-zh-hans.txt";
            break;
        case "zh-hant":
            fileName = "prompt-zh-hant.txt";
            break;
        default:
            fileName = "prompt-en-us.txt";
    }

    try {
        const promptsDir = path.join(process.cwd(), "src/app/api/chat/prompts");
        const filePath = path.join(promptsDir, fileName);
        const content = await fs.readFile(filePath, "utf-8");
        systemPromptCache.set(language, content);
        return content;
    } catch {
        const fallback = `You are a friendly, patient math tutor. Explain math concepts clearly using LaTeX for formulas.
Use step-by-step reasoning. Break down complex problems. Be encouraging and positive.
Format inline math with $...$ and display math with $$...$$.`;
        systemPromptCache.set(language, fallback);
        return fallback;
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession(request);
        if (!session) {
            return NextResponse.json({ error: "Please sign in to chat" }, { status: 401 });
        }

        const rateLimit = checkRateLimit(session.user.id);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Too many requests. Please wait a moment." },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(
                            Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
                        ),
                        "X-RateLimit-Limit": String(RATE_LIMIT),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": String(rateLimit.resetAt),
                    },
                }
            );
        }

        const { message, chatId, preferredLanguage } = await request.json();
        if (!message || typeof message !== "string") {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        let activeChatId = chatId;

        const systemPrompt = await getSystemPrompt(
            preferredLanguage || session.user.preferred_language || "en"
        );

        const userMsgId = uuidv4();
        if (activeChatId) {
            addMessage(userMsgId, activeChatId, "user", message, 0);
            updateChat(activeChatId, { preview: message.slice(0, 100) });
        } else {
            activeChatId = uuidv4();
            const title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
            createChat(activeChatId, session.user.id, title, message.slice(0, 100));
            addMessage(userMsgId, activeChatId, "user", message, 0);
        }

        const stream = await streamChatCompletion([
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
        ]);

        const reader = stream.getReader();
        const encoder = new TextEncoder();
        let fullResponse = "";

        const responseStream = new ReadableStream({
            async pull(controller) {
                try {
                    const { done, value } = await reader.read();
                    if (done) {
                        const assistantMsgId = uuidv4();
                        addMessage(assistantMsgId, activeChatId!, "assistant", fullResponse, 0);
                        const usageId = uuidv4();
                        logUsage(usageId, session.user.id, activeChatId!, 0, 0);
                        controller.close();
                        return;
                    }
                    const chunk = new TextDecoder().decode(value);
                    fullResponse += chunk;
                    controller.enqueue(encoder.encode(chunk));
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
                "X-RateLimit-Limit": String(RATE_LIMIT),
                "X-RateLimit-Remaining": String(rateLimit.remaining),
                "X-RateLimit-Reset": String(rateLimit.resetAt),
                "X-Chat-Id": activeChatId,
            },
        });
    } catch (error: any) {
        console.error("Chat API error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process message" },
            { status: 500 }
        );
    }
}