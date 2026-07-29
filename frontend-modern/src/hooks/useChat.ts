import { useState, useCallback } from 'preact/hooks';
import { sendChatMessageStream } from '../lib/api-client';
import type { Message } from '../types/message';
import type { UseChatReturn } from '../types/chat';

let msgCounter = 0;
function nextId(): string {
    return 'msg_' + (++msgCounter) + '_' + Date.now();
}

export function useChat(initialSessionId?: string, language?: string): UseChatReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
    const [pendingImage, setPendingImage] = useState<{ data: string; mimeType: string } | null>(null);


    const sendMessageCore = useCallback(async (text: string, isRegenerate = false) => {
        if (!text.trim()) return;
        setIsLoading(true);
        setError(null);

        if (!isRegenerate) {
            const userMsg: Message = { id: nextId(), role: 'user', content: text };
            setMessages(prev => [...prev, userMsg]);
        }

        const assistantMsg: Message = { id: nextId(), role: 'assistant', content: '' };
        if (!isRegenerate) {
            setMessages(prev => [...prev, assistantMsg]);
        }

        const history = messages.map(m => ({ role: m.role, content: m.content }));
        let currentContent = '';
        setIsStreaming(true);

        try {
            await sendChatMessageStream(
                text, history, sessionId,
                (chunk: string) => {
                    currentContent += chunk;
                    setMessages(prev => {
                        const updated = [...prev];
                        if (updated.length > 0) {
                            updated[updated.length - 1] = { ...updated[updated.length - 1], content: currentContent };
                        }
                        return updated;
                    });
                },
                () => {
                    setIsStreaming(false);
                    setIsLoading(false);
                },
                (err: Error) => {
                    setError(err.message);
                    setIsStreaming(false);
                    setIsLoading(false);
                },
                language
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            setIsStreaming(false);
            setIsLoading(false);
        }
    }, [messages, sessionId, language]);

    const sendMessage = useCallback(async (text?: string) => {
        const msg = text ?? input;
        if (!msg.trim()) return;
        if (text) {
            setInput('');
        }
        await sendMessageCore(msg);
    }, [input, sendMessageCore]);

    const handleStopGeneration = useCallback(() => {
        setIsStreaming(false);
        setIsLoading(false);
    }, []);

    const handleRegenerate = useCallback(async () => {
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMsg) {
            setMessages(prev => prev.slice(0, -1));
            await sendMessageCore(lastUserMsg.content, true);
        }
    }, [messages, sendMessageCore]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
        setSessionId(null);
    }, []);

    return { messages, input, setInput, isLoading, isStreaming, error, sessionId, pendingImage, setPendingImage, sendMessage, clearMessages, handleStopGeneration, handleRegenerate };
}
