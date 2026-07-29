import { useState, useCallback, useRef } from 'preact/hooks';
import { sendChatMessageStream } from '../lib/api-client';
import type { Message } from '../types/message';
import type { UseChatReturn } from '../types/chat';

export function useChat(initialSessionId?: string): UseChatReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
    const abortRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;
        setIsLoading(true);
        setError(null);

        const userMsg: Message = { role: 'user', content: text };
        const history = messages.map(m => ({ role: m.role, content: m.content }));

        setMessages(prev => [...prev, userMsg]);

        const assistantMsg: Message = { role: 'assistant', content: '' };
        setMessages(prev => [...prev, assistantMsg]);

        let currentContent = '';
        try {
            await sendChatMessageStream(
                text,
                history,
                sessionId,
                (chunk: string) => {
                    currentContent += chunk;
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { role: 'assistant', content: currentContent };
                        return updated;
                    });
                },
                () => {
                    setIsLoading(false);
                },
                (err: Error) => {
                    setError(err.message);
                    setIsLoading(false);
                }
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            setIsLoading(false);
        }
    }, [messages, sessionId]);

    const clearMessages = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
        setMessages([]);
        setError(null);
        setSessionId(null);
    }, []);

    return { messages, isLoading, error, sessionId, sendMessage, clearMessages };
}
