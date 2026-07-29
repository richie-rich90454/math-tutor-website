import { useState, useCallback, useRef } from 'preact/hooks';
import { sendChatMessageStream } from '../lib/api-client';

export function useChat() {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const abortRef = useRef(null);

    const sendMessage = useCallback(async (text) => {
        if (!text.trim()) return;
        setIsLoading(true);
        setError(null);

        const userMsg = { role: 'user', content: text };
        const history = messages.map(m => ({ role: m.role, content: m.content }));

        setMessages(prev => [...prev, userMsg]);

        const assistantMsg = { role: 'assistant', content: '' };
        setMessages(prev => [...prev, assistantMsg]);

        let currentContent = '';
        try {
            await sendChatMessageStream(
                text,
                history,
                sessionId,
                (chunk) => {
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
                (err) => {
                    setError(err.message);
                    setIsLoading(false);
                }
            );
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    }, [messages, sessionId]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
        setSessionId(null);
    }, []);

    return { messages, isLoading, error, sendMessage, clearMessages };
}
