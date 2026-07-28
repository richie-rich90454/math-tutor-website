import { useState, useRef, useCallback, useEffect } from "react";
import type { Message } from "@/types/chat";
import { parseUTCTimestamp } from "@/lib/date";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChat } from "@/contexts/ChatContext";
import { useToast } from "@/contexts/ToastContext";
import { exportChatAsMarkdown, exportChatAsText, downloadFile } from "@/lib/export";
import { announcePolite } from "@/lib/aria-live";

export function useChatMessages() {
    const { t, currentLanguage } = useLanguage();
    const { currentChat, setCurrentChat } = useChat();
    const { addToast } = useToast();

    const [input, setInput] = useState("");
    const [pendingImage, setPendingImage] = useState<{ data: string; mimeType: string } | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const prevMessagesLenRef = useRef(0);
    const isLoadingRef = useRef(false);
    const chatMessagesRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load messages when selecting a chat from sidebar
    useEffect(() => {
        if (!currentChat || isLoaded) return;

        if (currentChat.messages && currentChat.messages.length > 0) {
            const formatted = currentChat.messages.map((msg) => ({
                id: msg.id,
                content: msg.content,
                role: msg.role as "user" | "assistant",
                timestamp: parseUTCTimestamp(msg.timestamp),
            }));
            setMessages(formatted);
            setActiveChatId(currentChat.id);
            prevMessagesLenRef.current = formatted.length;
            setIsLoaded(true);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/chats/${currentChat.id}`);
                if (!res.ok || cancelled) return;
                const data = await res.json();
                if (cancelled) return;
                type ApiMessage = { id: string; content: string; role: string; created_at: string };
                const formatted = ((data.messages ?? []) as ApiMessage[]).map((msg) => ({
                    id: msg.id,
                    content: msg.content,
                    role: msg.role as "user" | "assistant",
                    timestamp: parseUTCTimestamp(msg.created_at),
                }));
                setMessages(formatted);
                setActiveChatId(currentChat.id);
                prevMessagesLenRef.current = formatted.length;
                setIsLoaded(true);
            } catch {
                if (!cancelled) {
                    setMessages([]);
                    prevMessagesLenRef.current = 0;
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [currentChat, isLoaded]);

    // Reset when currentChat becomes null (new chat)
    useEffect(() => {
        if (!currentChat) {
            setIsLoaded(false);
            setMessages([]);
            setActiveChatId(null);
            prevMessagesLenRef.current = 0;
        }
    }, [currentChat]);

    const sendMessage = useCallback(
        async (overrideInput?: string) => {
            const messageText = (overrideInput ?? input).trim();
            if (!messageText || isLoadingRef.current) return;

            isLoadingRef.current = true;
            const userMessage: Message = {
                id: Date.now().toString(),
                role: "user",
                content: messageText,
                timestamp: new Date(),
            };

            const currentInput = messageText;
            setInput("");
            setMessages((prev) => [...prev, userMessage]);
            setIsLoading(true);
            setIsStreaming(true);

            announcePolite(t("ariaLiveStreaming"));

            const controller = new AbortController();
            abortControllerRef.current = controller;
            const timeoutId = setTimeout(() => controller.abort(), 30_000);

            try {
                const response = await fetch("/api/chat/message", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: currentInput,
                        preferredLanguage: currentLanguage.code,
                        chatId: activeChatId,
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    let errMsg = "Failed to get response";
                    try {
                        const data = await response.json();
                        errMsg = data?.error || errMsg;
                    } catch {}
                    throw new Error(errMsg);
                }

                const serverChatId = response.headers.get("X-Chat-Id");
                if (serverChatId && serverChatId !== activeChatId) {
                    setActiveChatId(serverChatId);
                }

                const assistantId = (Date.now() + 1).toString();
                setMessages((prev) => [
                    ...prev,
                    { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
                ]);

                const reader = response.body?.getReader();
                if (!reader) throw new Error("No response body");
                const decoder = new TextDecoder();

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    if (!chunk) continue;
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantId ? { ...m, content: m.content + chunk } : m,
                        ),
                    );
                }
            } catch (error: unknown) {
                clearTimeout(timeoutId);
                const isAbort = error instanceof DOMException && error.name === "AbortError";
                if (isAbort) {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: (Date.now() + 1).toString(),
                            role: "assistant",
                            content: "Request timed out. Please try again.",
                            timestamp: new Date(),
                        },
                    ]);
                    return;
                }
                const errMsg = error instanceof Error ? error.message : "Failed to send message";
                console.error("Send error:", error);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        content: errMsg,
                        timestamp: new Date(),
                    },
                ]);
            } finally {
                isLoadingRef.current = false;
                setIsLoading(false);
                setIsStreaming(false);
                abortControllerRef.current = null;
            }
        },
        [input, currentLanguage.code, activeChatId, t],
    );

    const sendImage = useCallback(async () => {
        if (!pendingImage || isLoadingRef.current) return;

        isLoadingRef.current = true;

        const imageMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: `[Image] ${input || "Please solve this math problem"}`,
            timestamp: new Date(),
        };

        const imageData = pendingImage;
        const currentInput = input;
        setInput("");
        setPendingImage(null);
        setMessages((prev) => [...prev, imageMessage]);
        setIsLoading(true);
        setIsStreaming(true);

        const controller = new AbortController();
        abortControllerRef.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), 30_000);

        try {
            const response = await fetch("/api/chat/image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: imageData.data,
                    mimeType: imageData.mimeType,
                    message: currentInput || "",
                    preferredLanguage: currentLanguage.code,
                    chatId: activeChatId,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errMsg = "Failed to get response";
                try {
                    const data = await response.json();
                    errMsg = data?.error || errMsg;
                } catch {}
                throw new Error(errMsg);
            }

            const serverChatId = response.headers.get("X-Chat-Id");
            if (serverChatId && serverChatId !== activeChatId) {
                setActiveChatId(serverChatId);
            }

            const assistantId = (Date.now() + 1).toString();
            setMessages((prev) => [
                ...prev,
                { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
            ]);

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                if (!chunk) continue;
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId ? { ...m, content: m.content + chunk } : m,
                    ),
                );
            }
        } catch (error: unknown) {
            clearTimeout(timeoutId);
            const isAbort = error instanceof DOMException && error.name === "AbortError";
            if (isAbort) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        content: "Request timed out. Please try again.",
                        timestamp: new Date(),
                    },
                ]);
                return;
            }
            const errMsg = error instanceof Error ? error.message : "Failed to send image";
            console.error("Send image error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: errMsg,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            isLoadingRef.current = false;
            setIsLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    }, [pendingImage, input, currentLanguage.code, activeChatId]);

    const handleStopGeneration = useCallback(() => {
        abortControllerRef.current?.abort();
        isLoadingRef.current = false;
        setIsLoading(false);
        setIsStreaming(false);
    }, []);

    const handleRegenerate = useCallback(async () => {
        if (messages.length < 2 || isLoadingRef.current) return;
        const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
        if (!lastUserMsg) return;
        setMessages((prev) => {
            const lastUserIdx = prev.map((m) => m.role).lastIndexOf("user");
            return lastUserIdx >= 0 ? prev.slice(0, lastUserIdx) : prev;
        });
        setInput(lastUserMsg.content);
        sendMessage(lastUserMsg.content);
    }, [messages, sendMessage]);

    const handleEdit = useCallback((messageId: string, content: string) => {
        setInput(content);
        setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === messageId);
            if (idx < 0) return prev;
            return prev.slice(0, idx);
        });
    }, []);

    const handleNewChat = useCallback(() => {
        setMessages([]);
        setCurrentChat(null);
        setActiveChatId(null);
        setIsLoaded(false);
        setPendingImage(null);
    }, [setCurrentChat]);

    const handleExport = useCallback(
        (format: "md" | "txt") => {
            if (messages.length === 0) return;
            const title = currentChat?.title || "Math Chat";
            const msgs = messages.map((m) => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp.toISOString(),
            }));
            if (format === "md") {
                downloadFile(
                    exportChatAsMarkdown(msgs, title),
                    `${title.replace(/[^a-zA-Z0-9]/g, "_")}.md`,
                    "text/markdown",
                );
            } else {
                downloadFile(
                    exportChatAsText(msgs, title),
                    `${title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`,
                    "text/plain",
                );
            }
            addToast("success", t("chatExportSuccess").replace("%s", format.toUpperCase()));
        },
        [messages, currentChat, addToast, t],
    );

    const handleImageSelect = useCallback((imageData: string, mimeType: string) => {
        setPendingImage({ data: imageData, mimeType });
    }, []);

    return {
        input,
        setInput,
        pendingImage,
        setPendingImage,
        messages,
        isLoading,
        isStreaming,
        activeChatId,
        setActiveChatId,
        isLoaded,
        setIsLoaded,
        sendMessage,
        sendImage,
        handleRegenerate,
        handleStopGeneration,
        handleEdit,
        handleNewChat,
        handleExport,
        handleImageSelect,
        chatMessagesRef,
        messagesEndRef,
        prevMessagesLenRef,
    };
}
