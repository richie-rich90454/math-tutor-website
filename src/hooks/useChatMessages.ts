import { useState, useRef, useCallback, useEffect } from "react";
import type { Message } from "@/types/chat";
import type { ApiMessage } from "@/contracts/chat";
import { parseUTCTimestamp } from "@/lib/date";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChat } from "@/contexts/ChatContext";
import { useToast } from "@/contexts/ToastContext";
import { exportChatAsMarkdown, exportChatAsText, downloadFile } from "@/lib/export";
import { announcePolite } from "@/lib/aria-live";
import { apiFetch } from "@/lib/api-client";

export function useChatMessages() {
    const { t, currentLanguage } = useLanguage();
    const { currentChat, setCurrentChat, addChatSession, chatHistory } = useChat();
    const { addToast } = useToast();

    const [input, setInput] = useState("");
    const inputRef = useRef(input);
    useEffect(() => {
        inputRef.current = input;
    }, [input]);
    const [pendingImage, setPendingImage] = useState<{ data: string; mimeType: string } | null>(
        null,
    );
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [quotaWarn, setQuotaWarn] = useState(false);
    const pinnedIdsRef = useRef<Set<string>>(new Set());
    const setPinned = useCallback((ids: Set<string>) => {
        pinnedIdsRef.current = ids;
    }, []);

    const abortControllerRef = useRef<AbortController | null>(null);
    const stopRequestedRef = useRef(false);
    const freshRef = useRef(false);
    const prevMessagesLenRef = useRef(0);
    const isLoadingRef = useRef(false);
    const chatMessagesRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Stream rendering: chunks are buffered and flushed once per animation
    // frame instead of re-rendering on every network chunk (rAF batching).
    const assistantIdRef = useRef<string | null>(null);
    const streamBufferRef = useRef("");
    const streamRafRef = useRef(0);

    const flushStreamBuffer = useCallback(() => {
        streamRafRef.current = 0;
        if (!streamBufferRef.current) return;
        const text = streamBufferRef.current;
        streamBufferRef.current = "";
        const id = assistantIdRef.current;
        if (id) {
            setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, content: m.content + text } : m)),
            );
        }
    }, []);

    const appendStreamChunk = useCallback(
        (chunk: string) => {
            streamBufferRef.current += chunk;
            if (!streamRafRef.current) {
                streamRafRef.current = window.requestAnimationFrame(flushStreamBuffer);
            }
        },
        [flushStreamBuffer],
    );

    const flushStreamNow = useCallback(() => {
        if (streamRafRef.current) {
            window.cancelAnimationFrame(streamRafRef.current);
            streamRafRef.current = 0;
        }
        flushStreamBuffer();
    }, [flushStreamBuffer]);

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
                const res = await apiFetch(`/api/chats/${currentChat.id}`);
                if (!res.ok || cancelled) return;
                const data = await res.json();
                if (cancelled) return;
                const formatted = ((data.messages ?? []) as ApiMessage[]).map((msg) => ({
                    id: msg.id,
                    content: msg.content,
                    role: msg.role as "user" | "assistant",
                    timestamp: parseUTCTimestamp(msg.created_at),
                    isPinned: msg.is_pinned === 1,
                }));
                setMessages(formatted);
                setActiveChatId(currentChat.id);
                setPinned(
                    new Set(
                        ((data.messages ?? []) as ApiMessage[])
                            .filter((m) => m.is_pinned === 1)
                            .map((m) => m.id),
                    ),
                );
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
    }, [currentChat, isLoaded, setPinned]);

    // Reset when currentChat becomes null (new chat)
    useEffect(() => {
        if (!currentChat) {
            setIsLoaded(false);
            setMessages([]);
            setActiveChatId(null);
            setPinned(new Set());
            prevMessagesLenRef.current = 0;
        }
    }, [currentChat, setPinned]);

    // Persist the active chat so it can be resumed on the next visit.
    useEffect(() => {
        if (activeChatId) {
            try {
                localStorage.setItem("mt-last-chat-id", activeChatId);
            } catch {}
        }
    }, [activeChatId]);

    // Resume the last active chat once history is loaded, unless the user
    // disabled the preference in settings.
    const resumedRef = useRef(false);
    useEffect(() => {
        if (resumedRef.current || isLoaded || chatHistory.length === 0) return;
        try {
            if (localStorage.getItem("mt-resume-last-chat") === "0") {
                resumedRef.current = true;
                return;
            }
            const lastId = localStorage.getItem("mt-last-chat-id");
            const found = lastId ? chatHistory.find((c) => c.id === lastId) : undefined;
            if (found) {
                resumedRef.current = true;
                setCurrentChat(found);
                setIsLoaded(false);
            }
        } catch {
            resumedRef.current = true;
        }
    }, [chatHistory, isLoaded, setCurrentChat]);

    const sendMessage = useCallback(
        async (overrideInput?: string) => {
            const messageText = (overrideInput ?? inputRef.current).trim();
            if (!messageText || isLoadingRef.current) return;

            isLoadingRef.current = true;
            const userMessage: Message = {
                id: Date.now().toString(),
                role: "user",
                content: messageText,
                timestamp: new Date(),
            };

            const currentInput = messageText;
            const bypassCache = freshRef.current;
            freshRef.current = false;
            setInput("");
            setMessages((prev) => [...prev, userMessage]);
            setIsLoading(true);
            setIsStreaming(true);

            announcePolite(t("ariaLiveStreaming"));

            const controller = new AbortController();
            abortControllerRef.current = controller;
            const timeoutId = setTimeout(() => controller.abort(), 120_000);

            try {
                const response = await apiFetch("/api/chat/message", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: currentInput,
                        preferredLanguage: currentLanguage.code,
                        chatId: activeChatId,
                        bypassCache,
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

                setQuotaWarn(response.headers.get("X-Quota-Warning") === "true");

                const serverChatId = response.headers.get("X-Chat-Id");
                if (serverChatId && serverChatId !== activeChatId) {
                    const wasNewChat = !activeChatId;
                    setActiveChatId(serverChatId);
                    if (wasNewChat) {
                        addChatSession({
                            id: serverChatId,
                            title:
                                currentInput.slice(0, 50) + (currentInput.length > 50 ? "..." : ""),
                            timestamp: new Date().toISOString(),
                            preview: currentInput.slice(0, 100),
                            messages: [],
                        });
                    }
                }

            const assistantId = (Date.now() + 1).toString();
            const isCached = response.headers.get("X-Cache") === "hit";
            assistantIdRef.current = assistantId;
            setMessages((prev) => [
                ...prev,
                {
                    id: assistantId,
                    role: "assistant",
                    content: "",
                    timestamp: new Date(),
                    isCached,
                },
            ]);

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                if (!chunk) continue;
                appendStreamChunk(chunk);
            }
            flushStreamNow();
        } catch (error: unknown) {
            clearTimeout(timeoutId);
            flushStreamNow();
            const isAbort = error instanceof DOMException && error.name === "AbortError";
                if (isAbort) {
                    if (!stopRequestedRef.current) {
                        setMessages((prev) => [
                            ...prev,
                            {
                                id: (Date.now() + 1).toString(),
                                role: "assistant",
                                content: "Request timed out. Please try again.",
                                timestamp: new Date(),
                            },
                        ]);
                    }
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
                stopRequestedRef.current = false;
                abortControllerRef.current = null;
                assistantIdRef.current = null;
            }
        },
        [currentLanguage.code, activeChatId, t, addChatSession, appendStreamChunk, flushStreamNow],
    );

    const sendImage = useCallback(async () => {
        if (!pendingImage || isLoadingRef.current) return;

        isLoadingRef.current = true;

        const imageMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: `[Image] ${inputRef.current || "Please solve this math problem"}`,
            timestamp: new Date(),
        };

        const imageData = pendingImage;
        const currentInput = inputRef.current;
        setInput("");
        setPendingImage(null);
        setMessages((prev) => [...prev, imageMessage]);
        setIsLoading(true);
        setIsStreaming(true);

        const controller = new AbortController();
        abortControllerRef.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), 120_000);

        try {
            const response = await apiFetch("/api/chat/image", {
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

            setQuotaWarn(response.headers.get("X-Quota-Warning") === "true");

            const serverChatId = response.headers.get("X-Chat-Id");
            if (serverChatId && serverChatId !== activeChatId) {
                const wasNewChat = !activeChatId;
                setActiveChatId(serverChatId);
                if (wasNewChat) {
                    addChatSession({
                        id: serverChatId,
                        title:
                            (currentInput || "New chat").slice(0, 50) +
                            ((currentInput || "New chat").length > 50 ? "..." : ""),
                        timestamp: new Date().toISOString(),
                        preview: (currentInput || "New chat").slice(0, 100),
                        messages: [],
                    });
                }
            }

            const assistantId = (Date.now() + 1).toString();
            assistantIdRef.current = assistantId;
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
                appendStreamChunk(chunk);
            }
            flushStreamNow();
        } catch (error: unknown) {
            clearTimeout(timeoutId);
            flushStreamNow();
            const isAbort = error instanceof DOMException && error.name === "AbortError";
            if (isAbort) {
                if (!stopRequestedRef.current) {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: (Date.now() + 1).toString(),
                            role: "assistant",
                            content: "Request timed out. Please try again.",
                            timestamp: new Date(),
                        },
                    ]);
                }
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
            assistantIdRef.current = null;
        }
    }, [pendingImage, currentLanguage.code, activeChatId, addChatSession, appendStreamChunk, flushStreamNow]);

    const handleStopGeneration = useCallback(() => {
        stopRequestedRef.current = true;
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

    const handleFreshAnswer = useCallback(async () => {
        if (messages.length < 2 || isLoadingRef.current) return;
        const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
        if (!lastUserMsg) return;
        freshRef.current = true;
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

    const togglePin = useCallback(
        async (messageId: string) => {
            if (!activeChatId) return;
            const nextPinned = !pinnedIdsRef.current.has(messageId);
            const next = new Set(pinnedIdsRef.current);
            if (nextPinned) {
                next.add(messageId);
            } else {
                next.delete(messageId);
            }
            setPinned(next);
            setMessages((prev) =>
                prev.map((m) => (m.id === messageId ? { ...m, isPinned: nextPinned } : m)),
            );
            try {
                await apiFetch(`/api/chats/${activeChatId}/messages/${messageId}/pin`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pinned: nextPinned }),
                });
            } catch {
                // optimistic update; ignore API errors
            }
        },
        [activeChatId, setPinned],
    );

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
        handleFreshAnswer,
        handleStopGeneration,
        handleEdit,
        handleNewChat,
        handleExport,
        handleImageSelect,
        chatMessagesRef,
        messagesEndRef,
        prevMessagesLenRef,
        quotaWarn,
        togglePin,
    };
}
