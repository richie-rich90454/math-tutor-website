"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export interface ChatSession {
    id: string;
    title: string;
    timestamp: string;
    preview: string;
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
    deleteChat: (chatId: string) => void;
    renameChat: (chatId: string, newTitle: string) => void;
    loadChatHistory: () => Promise<void>;
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
            // Silently fail — chats will remain in local state
        } finally {
            setIsHistoryLoading(false);
        }
    }, []);

    // Load chat history when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            loadChatHistory();
        } else {
            setChatHistory([]);
        }
    }, [isAuthenticated, loadChatHistory]);

    const addChatSession = (session: ChatSession) => {
        setChatHistory((prev) => [session, ...prev]);
    };

    const addMessage = (chatId: string, message: ChatMessage) => {
        setChatHistory((prev) =>
            prev.map((chat) =>
                chat.id === chatId ? { ...chat, messages: [...chat.messages, message] } : chat
            )
        );
    };

    const deleteChat = (chatId: string) => {
        // Remove the chat from history
        setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));

        // If the deleted chat was the current chat, clear it
        if (currentChat?.id === chatId) {
            setCurrentChat(null);
        }
    };

    const renameChat = useCallback((chatId: string, newTitle: string) => {
        setChatHistory((prev) =>
            prev.map((chat) =>
                chat.id === chatId ? { ...chat, title: newTitle, preview: newTitle } : chat
            )
        );
        if (currentChat?.id === chatId) {
            setCurrentChat((prev) => (prev ? { ...prev, title: newTitle } : prev));
        }
    }, [currentChat]);

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
