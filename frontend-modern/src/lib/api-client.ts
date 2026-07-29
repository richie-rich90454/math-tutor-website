import type { ChatRequest, ChatResponse } from '../types/chat';
import type { ChatMessageDto } from '../types/message';

export async function sendChatMessage(
    message: string,
    history: ChatMessageDto[],
    sessionId: string | null
): Promise<ChatResponse> {
    const body: ChatRequest = { message, history, sessionId };
    const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Chat request failed');
    return res.json();
}

export async function sendChatMessageStream(
    message: string,
    history: ChatMessageDto[],
    sessionId: string | null,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: Error) => void
): Promise<void> {
    const body: ChatRequest = { message, history, sessionId };
    const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        onError(new Error('Stream request failed'));
        return;
    }
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                    onDone();
                    return;
                }
                onChunk(data);
            }
        }
    }
    onDone();
}
