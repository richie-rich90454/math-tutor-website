import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Using nodejs runtime to access filesystem (commented out edge runtime)
// export const runtime = 'edge';

async function getSystemPrompt(language: string): Promise<string> {
    // Map language codes to file names
    let fileName: string;
    switch (language) {
        case "zh":
        case "zh-hans":
            fileName = "prompt-zh-hans.txt";
            break;
        case "zh-hant":
            fileName = "prompt-zh-hant.txt";
            break;
        case "en":
        case "en-us":
        default:
            fileName = "prompt-en-us.txt";
    }

    try {
        // Read the prompt file from the prompts directory
        // Using process.cwd() which works in Vercel serverless functions
        const promptsDir = path.join(process.cwd(), "src/app/api/chat/prompts");
        const filePath = path.join(promptsDir, fileName);
        const content = await fs.readFile(filePath, "utf-8");
        return content;
    } catch (error) {
        console.error(`Failed to read prompt file for language ${language}:`, error);
        // Fallback to default prompts
        if (language === "zh" || language === "zh-hans" || language === "zh-hant") {
            return `你是一个友好、耐心的数学导师。
请用简单易懂的方式解释数学概念，适合学生学习。

数学公式格式化：
- 对于行内数学表达式，使用单个美元符号：$x^2 + y^2 = z^2$
- 对于独立的数学公式，使用双美元符号：
  $$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$
- 使用LaTeX语法编写数学符号和公式

Markdown格式化：
- 使用标题（#, ##, ###）来组织内容
- 使用列表（-, 1.）来列举步骤或要点
- 使用**粗体**来强调重要概念
- 使用表格来组织数据

指导原则：
1. 使用适合年龄的简单语言
2. 解释概念时包含文化参考和类比
3. 保持积极和鼓励的态度
4. 将复杂问题分解为简单步骤
5. 所有数学表达式必须使用LaTeX语法

记住要让数学变得有趣和易于理解！`;
        } else {
            return `You are a friendly, patient math tutor for students. 
You specialize in explaining math concepts in a clear and engaging way.

Mathematical Formula Formatting:
- For inline math expressions, use single dollar signs: $x^2 + y^2 = z^2$
- For display math formulas, use double dollar signs:
  $$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$
- Use LaTeX syntax for all mathematical symbols and formulas

Markdown Formatting:
- Headers (#, ##, ###) to organize content
- Lists (-, 1.) for steps or key points
- **Bold** for important concepts
- Tables for organizing data

Guidelines:
1. Use simple, age-appropriate language
2. Include relatable examples and analogies when explaining concepts
3. Be encouraging and positive
4. Break down complex problems into simple steps
5. ALL mathematical expressions MUST use LaTeX syntax with $ or $$

Remember to make math fun and understandable!`;
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const { message, preferredLanguage } = await request.json();

        // Check if API key is configured
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "YOUR_API_KEY_HERE") {
            return NextResponse.json(
                { error: "API key not configured. Please set up your OpenAI API key." },
                { status: 500 }
            );
        }

        const systemPrompt = await getSystemPrompt(preferredLanguage || "en");

        // Defer OpenAI SDK import and client instantiation to request time
        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
        });

        const model = process.env.OPENAI_MODEL || "gpt-5-nano-2025-08-07";
        const maxTokens = 5000;
        const temperature = 0.3;

        try {
            const completion = await openai.chat.completions.create({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message },
                ],
                temperature: temperature,
                max_tokens: maxTokens,
                stream: true,
            });

            const encoder = new TextEncoder();
            const stream = new ReadableStream<Uint8Array>({
                async start(controller) {
                    try {
                        for await (const part of completion) {
                            const token = part.choices?.[0]?.delta?.content || "";
                            if (token) controller.enqueue(encoder.encode(token));
                        }
                    } catch (err) {
                        const msg = (err as any)?.message || "Stream error";
                        controller.enqueue(encoder.encode(`\n[StreamError] ${msg}`));
                    } finally {
                        controller.close();
                    }
                },
            });

            return new Response(stream, {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "Cache-Control": "no-cache, no-transform",
                    "X-Accel-Buffering": "no",
                },
            });
        } catch (apiError: any) {
            console.error("OpenAI API Error:", apiError);

            if (apiError?.status === 401) {
                return NextResponse.json(
                    { error: "Invalid API key. Please check your OpenAI API key." },
                    { status: 401 }
                );
            }
            if (apiError?.status === 429) {
                return NextResponse.json(
                    { error: "Rate limit exceeded. Please try again later." },
                    { status: 429 }
                );
            }
            return NextResponse.json(
                { error: "Failed to process message. Please try again." },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Error in chat API:", error);
        return NextResponse.json(
            { error: "Failed to process message. Please try again." },
            { status: 500 }
        );
    }
}
