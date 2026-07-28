import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-middleware";
import { deepseek } from "@/lib/ai/deepseek";
import { getSystemPrompt, extractTopic } from "@/lib/ai/prompts";
import { buildContext, MAX_CONTEXT_MESSAGES } from "@/lib/ai/context";
import { addMessage, getRecentMessages } from "@/lib/db/messages";
import { createChat, updateChat, getChatById } from "@/lib/db/chats";
import { logUsage } from "@/lib/db/usage";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { v4 as uuidv4 } from "uuid";
import { chatMessageSchema } from "@/lib/validators";
import { validateBody } from "@/lib/api-utils";

const CHAT_RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;

export async function POST(request: NextRequest) {
    try {
        const session = await getSession(request);
        if (!session) {
            return NextResponse.json({ error: "Please sign in to chat" }, { status: 401 });
        }

        const ip =
            request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
        const ipRl = rateLimit(`chat:ip:${ip}`, 60, RATE_WINDOW_MS);
        if (!ipRl.allowed) {
            return NextResponse.json(
                { error: "Too many requests. Please wait a moment." },
                {
                    status: 429,
                    headers: { ...getRateLimitHeaders(ipRl), "Retry-After": "60" },
                },
            );
        }

        const userRl = rateLimit(`chat:user:${session.user.id}`, CHAT_RATE_LIMIT, RATE_WINDOW_MS);
        if (!userRl.allowed) {
            return NextResponse.json(
                { error: "Too many requests. Please wait a moment." },
                {
                    status: 429,
                    headers: {
                        ...getRateLimitHeaders(userRl),
                        "Retry-After": String(Math.ceil((userRl.resetAt - Date.now()) / 1000)),
                    },
                },
            );
        }

        const { data, error } = await validateBody(request, chatMessageSchema);
        if (error) return error;

        const { message, chatId, preferredLanguage } = data;
        const sanitizedMessage = message.trim();

        let activeChatId = chatId;

        const systemPrompt = await getSystemPrompt(
            preferredLanguage || session.user.preferred_language || "en",
        );

        const userMsgId = uuidv4();
        if (activeChatId) {
            // Check if chat exists in database
            const existingChat = getChatById(activeChatId);
            if (existingChat) {
                addMessage(userMsgId, activeChatId, "user", sanitizedMessage, 0);
                updateChat(activeChatId, { preview: sanitizedMessage.slice(0, 100) });
                const topic = extractTopic(sanitizedMessage);
                if (topic) updateChat(activeChatId, { topic });
            } else {
                // Chat doesn't exist, create it with the provided ID
                const title =
                    sanitizedMessage.slice(0, 50) + (sanitizedMessage.length > 50 ? "..." : "");
                const topic = extractTopic(sanitizedMessage);
                createChat(activeChatId, session.user.id, title, sanitizedMessage.slice(0, 100));
                if (topic) updateChat(activeChatId, { topic });
                addMessage(userMsgId, activeChatId, "user", sanitizedMessage, 0);
            }
        } else {
            activeChatId = uuidv4();
            const title =
                sanitizedMessage.slice(0, 50) + (sanitizedMessage.length > 50 ? "..." : "");
            const topic = extractTopic(sanitizedMessage);
            createChat(activeChatId, session.user.id, title, sanitizedMessage.slice(0, 100));
            if (topic) updateChat(activeChatId, { topic });
            addMessage(userMsgId, activeChatId, "user", sanitizedMessage, 0);
        }

        const history = activeChatId ? getRecentMessages(activeChatId, MAX_CONTEXT_MESSAGES) : [];
        const contextMessages = buildContext(systemPrompt, history, sanitizedMessage);

        const stream = await deepseek.streamChat(contextMessages);

        const reader = stream.getReader();
        const encoder = new TextEncoder();
        let fullResponse = "";

        const responseStream = new ReadableStream({
            async pull(controller) {
                try {
                    const { done, value } = await reader.read();
                    if (done) {
                        // Save accumulated response to DB
                        if (fullResponse.trim()) {
                            const assistantMsgId = uuidv4();
                            addMessage(assistantMsgId, activeChatId!, "assistant", fullResponse, 0);
                            logUsage(uuidv4(), session.user.id, activeChatId!, 0, 0);
                        }
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
                ...getRateLimitHeaders(userRl),
                "X-Chat-Id": activeChatId,
            },
        });
    } catch (error: unknown) {
        console.error("Chat API error:", error);
        const message = error instanceof Error ? error.message : "Failed to process message";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
