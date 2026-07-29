export const MAX_CONTEXT_MESSAGES = 20;
export const MAX_PROMPT_SIZE = 4000;

export interface ContextMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export function buildContext(
    systemPrompt: string,
    history: { role: string; content: string }[],
    newMessage: string,
): ContextMessage[] {
    const context: ContextMessage[] = [{ role: "system", content: systemPrompt }];

    const recent = history.slice(-MAX_CONTEXT_MESSAGES);
    for (const msg of recent) {
        context.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
        });
    }

    context.push({ role: "user", content: newMessage });

    return context;
}
