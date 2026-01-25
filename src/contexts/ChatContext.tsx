"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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
    addChatSession: (session: ChatSession) => void;
    setCurrentChat: (session: ChatSession | null) => void;
    addMessage: (chatId: string, message: ChatMessage) => void;
    deleteChat: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [chatHistory, setChatHistory] = useState<ChatSession[]>([
        {
            id: "1",
            title: "Algebra Help",
            timestamp: "2024-01-15 10:30 AM",
            preview: "How do I solve quadratic equations?",
            messages: [
                {
                    id: "1",
                    content: "How do I solve quadratic equations?",
                    role: "user",
                    timestamp: "2024-01-15 10:30 AM",
                },
                {
                    id: "2",
                    content:
                        "To solve quadratic equations, you can use the quadratic formula: x = (-b ± √(b²-4ac)) / 2a",
                    role: "assistant",
                    timestamp: "2024-01-15 10:31 AM",
                },
            ],
        },
        {
            id: "2",
            title: "Geometry Question",
            timestamp: "2024-01-14 2:15 PM",
            preview: "What is the area of a circle?",
            messages: [
                {
                    id: "3",
                    content: "What is the area of a circle?",
                    role: "user",
                    timestamp: "2024-01-14 2:15 PM",
                },
                {
                    id: "4",
                    content: "The area of a circle is π × r², where r is the radius of the circle.",
                    role: "assistant",
                    timestamp: "2024-01-14 2:16 PM",
                },
            ],
        },
        {
            id: "3",
            title: "Times Tables Practice",
            timestamp: "2024-01-13 9:45 AM",
            preview: "Help me practice 7 times table",
            messages: [
                {
                    id: "5",
                    content: "Help me practice 7 times table",
                    role: "user",
                    timestamp: "2024-01-13 9:45 AM",
                },
            ],
        },
        {
            id: "4",
            title: "Fractions Tutorial",
            timestamp: "2024-01-12 4:20 PM",
            preview: "How do I add fractions with different denominators?",
            messages: [
                {
                    id: "6",
                    content: "How do I add fractions with different denominators?",
                    role: "user",
                    timestamp: "2024-01-12 4:20 PM",
                },
            ],
        },
    ]);

    const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);

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

    return (
        <ChatContext.Provider
            value={{
                chatHistory,
                currentChat,
                addChatSession,
                setCurrentChat,
                addMessage,
                deleteChat,
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
