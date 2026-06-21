import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-middleware";
import { streamChatCompletion } from "@/lib/deepseek";
import { addMessage, getRecentMessages } from "@/lib/db/messages";
import { createChat, updateChat, getChatById } from "@/lib/db/chats";
import { logUsage } from "@/lib/db/usage";
import { rateLimit } from "@/lib/rate-limit";
import { v4 as uuidv4 } from "uuid";
import { promises as fs } from "fs";
import path from "path";

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const TOPIC_KEYWORDS: Record<string, string[]> = {
    algebra: [
        "algebra",
        "equation",
        "variable",
        "polynomial",
        "factor",
        "quadratic",
        "linear",
        "inequality",
        "matrix",
        "алгебр",
        "方程式",
        "الجبر",
        "algèbre",
        "Algebra",
        "алгебр",
    ],
    geometry: [
        "geometry",
        "angle",
        "triangle",
        "circle",
        "area",
        "perimeter",
        "volume",
        "surface",
        "parallel",
        "perpendicular",
        "геометр",
        "几何",
        "هندسة",
        "géométrie",
        "Geometrie",
        "геометр",
    ],
    calculus: [
        "calculus",
        "derivative",
        "integral",
        "limit",
        "differentiation",
        "integration",
        "differential",
        "optimization",
        " calculus",
        "интеграл",
        "微积分",
        "حساب التفاضل",
        "calcul",
        "分析",
    ],
    trigonometry: [
        "trigonometry",
        "sine",
        "cosine",
        "tangent",
        "trig",
        "angle",
        "radian",
        "triangl",
        "тригонометр",
        "三角函数",
        "usul",
        "trigonométrie",
        "trigonometrie",
    ],
    statistics: [
        "statistics",
        "probability",
        "mean",
        "median",
        "standard deviation",
        "variance",
        "distribution",
        "sample",
        "статистик",
        "统计",
        "إحصاء",
        "statistique",
        "Statistik",
    ],
    arithmetic: [
        "addition",
        "subtraction",
        "multiplication",
        "division",
        "fraction",
        "decimal",
        "percentage",
        "arithmetic",
        "算术",
        "أithmetic",
        "arithmétique",
        "Arithmetik",
    ],
    "linear algebra": [
        "matrix",
        "vector",
        "eigenvalue",
        "linear transformation",
        "determinant",
        "span",
        "basis",
        "линейная алгебр",
        "线性代数",
        "جبر خطي",
        "algèbre linéaire",
        "Lineare Algebra",
    ],
    "number theory": [
        "prime",
        "divisibility",
        "modular",
        "congruence",
        "gcd",
        "lcm",
        "diophantine",
        "теория чисел",
        "数论",
        "نظرية الأعداد",
        "théorie des nombres",
    ],
    "differential equations": [
        "differential equation",
        "ode",
        "pde",
        "laplace",
        "fourier",
        "уравнение",
        "微分方程",
        "المعادلات التفاضلية",
        "équation différentielle",
        "Differentialgleichung",
    ],
    "word problems": [
        "word problem",
        "real world",
        "application",
        "scenario",
        "бодлог",
        "应用题",
        "مسألة",
        "problème",
        "Anwendung",
    ],
};

function extractTopic(message: string): string | null {
    const lower = message.toLowerCase();
    let bestTopic: string | null = null;
    let bestScore = 0;

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        let score = 0;
        for (const kw of keywords) {
            if (lower.includes(kw.toLowerCase())) score++;
        }
        if (score > bestScore) {
            bestScore = score;
            bestTopic = topic;
        }
    }

    return bestTopic;
}

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
            break;
        case "zh-hans":
            fileName = "prompt-zh-hans.txt";
            break;
        case "zh-hant":
            fileName = "prompt-zh-hant.txt";
            break;
        case "bo":
            fileName = "prompt-bo.txt";
            break;
        case "mn-cyrl":
            fileName = "prompt-mn-cyrl.txt";
            break;
        case "mn-mong":
            fileName = "prompt-mn-mong.txt";
            break;
        case "es":
            fileName = "prompt-es.txt";
            break;
        case "fr":
            fileName = "prompt-fr.txt";
            break;
        case "de":
            fileName = "prompt-de.txt";
            break;
        case "ja":
            fileName = "prompt-ja.txt";
            break;
        case "en":
            fileName = "prompt-en-us.txt";
            break;
        default:
            fileName = "prompt-en-us.txt";
            break;
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

        const ip =
            request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
        const { allowed: ipAllowed } = rateLimit(`chat:${ip}`, 30, 60 * 1000);

        if (!ipAllowed) {
            return Response.json(
                { error: "Too many requests. Please wait a moment." },
                {
                    status: 429,
                    headers: {
                        "Retry-After": "60",
                        "X-RateLimit-Remaining": "0",
                    },
                },
            );
        }

        const userRateLimit = checkRateLimit(session.user.id);
        if (!userRateLimit.allowed) {
            return NextResponse.json(
                { error: "Too many requests. Please wait a moment." },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(
                            Math.ceil((userRateLimit.resetAt - Date.now()) / 1000),
                        ),
                        "X-RateLimit-Limit": String(RATE_LIMIT),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": String(userRateLimit.resetAt),
                    },
                },
            );
        }

        const { message, chatId, preferredLanguage } = await request.json();

        // Validate inputs
        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }
        if (message.length > 4000) {
            return NextResponse.json({ error: "Message is too long" }, { status: 400 });
        }
        // Sanitize: trim
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

        // Build conversation context: system prompt + last 20 messages + new user message
        const contextMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
            { role: "system", content: systemPrompt },
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

        contextMessages.push({ role: "user", content: sanitizedMessage });

        const stream = await streamChatCompletion(contextMessages);

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
                "X-RateLimit-Limit": String(RATE_LIMIT),
                "X-RateLimit-Remaining": String(userRateLimit.remaining),
                "X-RateLimit-Reset": String(userRateLimit.resetAt),
                "X-Chat-Id": activeChatId,
            },
        });
    } catch (error: any) {
        console.error("Chat API error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process message" },
            { status: 500 },
        );
    }
}
