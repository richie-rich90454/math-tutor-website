"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export interface ChatSession {
    id: string;
    title: string;
    timestamp: string;
    preview: string;
    topic?: string | null;
    messages: ChatMessage[];
}

export interface ChatMessage {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: string;
}

interface ChatContextType {
    chatHistory: ChatSession[];
    currentChat: ChatSession | null;
    isHistoryLoading: boolean;
    addChatSession: (session: ChatSession) => void;
    setCurrentChat: (session: ChatSession | null) => void;
    addMessage: (chatId: string, message: ChatMessage) => void;
    deleteChat: (chatId: string) => Promise<void>;
    renameChat: (chatId: string, newTitle: string) => Promise<void>;
    loadChatHistory: () => Promise<void>;
    syncChatId: (oldId: string, newId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
    const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    const loadChatHistory = useCallback(async () => {
        try {
            setIsHistoryLoading(true);
            const res = await fetch("/api/chats");
            if (res.ok) {
                const data = await res.json();
                setChatHistory(data.chats || []);
            }
        } catch {
            // Silently fail
        } finally {
            setIsHistoryLoading(false);
        }
    }, []);

    // Load chat history when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            loadChatHistory();
        } else {
            setChatHistory([]);
            setCurrentChat(null);
        }
    }, [isAuthenticated, loadChatHistory]);

    const addChatSession = useCallback((session: ChatSession) => {
        setChatHistory((prev) => {
            // Replace existing session with same ID, or prepend new one
            const exists = prev.findIndex((c) => c.id === session.id);
            if (exists >= 0) {
                const next = [...prev];
                next[exists] = session;
                return next;
            }
            return [session, ...prev];
        });
    }, []);

    const addMessage = useCallback((chatId: string, message: ChatMessage) => {
        setChatHistory((prev) =>
            prev.map((chat) =>
                chat.id === chatId ? { ...chat, messages: [...chat.messages, message] } : chat,
            ),
        );
    }, []);

    const syncChatId = useCallback((oldId: string, newId: string) => {
        setChatHistory((prev) => {
            const chat = prev.find((c) => c.id === oldId);
            if (!chat) return prev;
            const updated = { ...chat, id: newId };
            return prev.filter((c) => c.id !== oldId).concat([updated]);
        });
        setCurrentChat((prev) => (prev?.id === oldId ? { ...prev, id: newId } : prev));
    }, []);

    const deleteChat = useCallback(
        async (chatId: string) => {
            try {
                const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
                if (res.ok) {
                    setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
                    if (currentChat?.id === chatId) {
                        setCurrentChat(null);
                    }
                }
            } catch {
                // Silently fail
            }
        },
        [currentChat],
    );

    const renameChat = useCallback(
        async (chatId: string, newTitle: string) => {
            try {
                const res = await fetch(`/api/chats/${chatId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: newTitle }),
                });
                if (res.ok) {
                    setChatHistory((prev) =>
                        prev.map((chat) =>
                            chat.id === chatId
                                ? { ...chat, title: newTitle, preview: newTitle }
                                : chat,
                        ),
                    );
                    if (currentChat?.id === chatId) {
                        setCurrentChat((prev) => (prev ? { ...prev, title: newTitle } : prev));
                    }
                }
            } catch {
                // Silently fail
            }
        },
        [currentChat],
    );

    return (
        <ChatContext.Provider
            value={{
                chatHistory,
                currentChat,
                isHistoryLoading,
                addChatSession,
                setCurrentChat,
                addMessage,
                deleteChat,
                renameChat,
                loadChatHistory,
                syncChatId,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
}
