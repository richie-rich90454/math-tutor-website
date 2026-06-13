"use client";

import { useState, useRef, useEffect } from "react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import Sidebar from "@/components/ui/Sidebar";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChat, ChatSession } from "@/contexts/ChatContext";

interface Message {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
}

export default function Home() {
    const { t, currentLanguage } = useLanguage();
    const { currentChat, addChatSession, setCurrentChat } = useChat();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load messages from current chat when it changes
    useEffect(() => {
        if (currentChat && currentChat.messages) {
            const formattedMessages = currentChat.messages.map((msg) => ({
                id: msg.id,
                content: msg.content,
                role: msg.role as "user" | "assistant",
                timestamp: new Date(msg.timestamp),
            }));
            setMessages(formattedMessages);
        } else {
            setMessages([]);
        }
    }, [currentChat]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        const currentInput = input;
        setInput("");
        setIsLoading(true);

        // If this is the first message, create a new chat session
        if (messages.length === 0) {
            const newChat: ChatSession = {
                id: Date.now().toString(),
                title: currentInput.slice(0, 30) + (currentInput.length > 30 ? "..." : ""),
                timestamp: new Date().toLocaleString(),
                preview: currentInput,
                messages: [
                    {
                        id: userMessage.id,
                        content: currentInput,
                        role: "user" as const,
                        timestamp: userMessage.timestamp.toISOString(),
                    },
                ],
            };
            addChatSession(newChat);
            setCurrentChat(newChat);
        }

        try {
            const response = await fetch("/api/chat/message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: currentInput,
                    preferredLanguage: currentLanguage.code,
                }),
            });

            if (!response.ok) {
                // Try to parse JSON error if available
                let errMsg = "Failed to get response";
                try {
                    const data = await response.json();
                    errMsg = data?.error || errMsg;
                } catch {}
                throw new Error(errMsg);
            }

            const id = (Date.now() + 1).toString();
            const assistantMessage: Message = {
                id,
                role: "assistant",
                content: "",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("No response body");

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                if (!chunk) continue;
                setMessages((prev) =>
                    prev.map((m) => (m.id === id ? { ...m, content: m.content + chunk } : m))
                );
            }
        } catch (error: any) {
            console.error("Error sending message:", error);

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: error.message || "Sorry, I encountered an error. Please try again.",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="app-shell">
            {/* Sidebar - Fixed position */}
            <div
                className={`app-sidebar-wrapper ${
                    isSidebarOpen ? "is-open" : "is-collapsed"
                }`}
            >
                <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
            </div>

            {/* Main Content - with margin for sidebar */}
            <div
                className={`app-main ${
                    isSidebarOpen ? "with-sidebar" : "with-sidebar-collapsed"
                }`}
            >
                {/* Header - Fixed at top */}
                <div className="app-header">
                    <div className="app-header-inner">
                        {messages.length > 0 && (
                            <button
                                onClick={() => {
                                    setMessages([]);
                                    setCurrentChat(null);
                                }}
                                className="app-header-new-chat-btn"
                                aria-label="New chat"
                            >
                                <svg
                                    className="app-header-icon"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            </button>
                        )}
                        <LanguageSwitcher />
                    </div>
                </div>

                {/* Dynamic Content Area - Main scrollable area */}
                <div
                    className={`content-area ${
                        messages.length === 0 ? "is-centered" : "is-top"
                    }`}
                >
                    {/* Logo and Welcome Message - Centered initially */}
                    {messages.length === 0 && (
                        <div className="flex transform flex-col items-center justify-center px-6 transition-all duration-700 ease-out">
                            <div className="mx-auto mb-12 max-w-2xl text-center">
                                <h1 className="mb-3 text-5xl font-bold text-gray-900">
                                    {t("title")}
                                </h1>
                                <p className="text-xl text-gray-600">{t("subtitle")}</p>
                            </div>

                            {/* Centered Input Box for initial state */}
                            <div className="mx-auto w-full max-w-2xl px-6">
                                <div className="relative">
                                    <div className="rounded-2xl border border-gray-200 bg-white p-1 shadow-lg">
                                        <div className="flex items-center">
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder={t("inputPlaceholder")}
                                                className="flex-1 border-none bg-transparent px-5 py-4 text-base placeholder-gray-400 outline-none"
                                                disabled={isLoading}
                                                autoFocus
                                            />
                                            <button
                                                onClick={sendMessage}
                                                disabled={!input.trim() || isLoading}
                                                className="mr-1 rounded-xl bg-gray-900 p-3 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Example prompts */}
                                <div className="mt-6 flex flex-wrap justify-center gap-2">
                                    <button
                                        onClick={() => {
                                            setInput(t("examplePracticeAddition"));
                                            setTimeout(() => sendMessage(), 0);
                                        }}
                                        className="rounded-lg border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-700 backdrop-blur-sm transition-all hover:border-gray-300 hover:bg-white"
                                    >
                                        {t("practiceAddition")}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setInput(t("exampleLearnGeometry"));
                                            setTimeout(() => sendMessage(), 0);
                                        }}
                                        className="rounded-lg border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-700 backdrop-blur-sm transition-all hover:border-gray-300 hover:bg-white"
                                    >
                                        {t("learnGeometry")}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setInput(t("exampleTimesTables"));
                                            setTimeout(() => sendMessage(), 0);
                                        }}
                                        className="rounded-lg border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-700 backdrop-blur-sm transition-all hover:border-gray-300 hover:bg-white"
                                    >
                                        {t("timesTables")}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setInput(t("exampleCulturalExamples"));
                                            setTimeout(() => sendMessage(), 0);
                                        }}
                                        className="rounded-lg border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-700 backdrop-blur-sm transition-all hover:border-gray-300 hover:bg-white"
                                    >
                                        {t("culturalExamples")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chat Messages Area - Shows when conversation starts */}
                    {messages.length > 0 && (
                        <>
                            <div className="flex-1 overflow-y-auto px-4 pt-20">
                                <div className="mx-auto max-w-3xl pb-4">
                                    <div className="space-y-4">
                                        {messages.map((message, index) => (
                                            <div
                                                key={message.id}
                                                className={`animate-fade-in flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                                style={{
                                                    animation: `fadeIn 0.3s ease-out`,
                                                    animationDelay: `${index * 0.05}s`,
                                                    animationFillMode: "backwards",
                                                }}
                                            >
                                                <div
                                                    className={`group relative ${message.role === "user" ? "max-w-[70%]" : "max-w-[85%]"}`}
                                                >
                                                    {message.role === "user" ? (
                                                        <>
                                                            <div className="rounded-2xl bg-gray-900 px-4 py-3 text-white shadow-sm">
                                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                                    {message.content}
                                                                </p>
                                                            </div>
                                                            <span className="mt-1 block px-2 text-right text-xs text-gray-400">
                                                                {message.timestamp.toLocaleTimeString(
                                                                    [],
                                                                    {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    }
                                                                )}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                                                                <div className="prose prose-sm prose-gray max-w-none">
                                                                    <MarkdownRenderer
                                                                        content={message.content}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <span className="mt-1 block px-2 text-left text-xs text-gray-400">
                                                                {message.timestamp.toLocaleTimeString(
                                                                    [],
                                                                    {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    }
                                                                )}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Loading indicator */}
                                        {isLoading && (
                                            <div className="animate-fade-in flex justify-start">
                                                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                                                    <div className="flex space-x-1.5">
                                                        <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400"></div>
                                                        <div
                                                            className="h-2 w-2 animate-pulse rounded-full bg-gray-400"
                                                            style={{ animationDelay: "150ms" }}
                                                        ></div>
                                                        <div
                                                            className="h-2 w-2 animate-pulse rounded-full bg-gray-400"
                                                            style={{ animationDelay: "300ms" }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>
                            </div>

                            {/* Input Section - Fixed at bottom when in chat mode */}
                            <div className="flex-shrink-0 border-t border-gray-200 bg-white/90 px-4 py-4 backdrop-blur-sm">
                                <div className="mx-auto max-w-3xl">
                                    <div className="rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
                                        <div className="flex items-center">
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder={t("inputPlaceholder")}
                                                className="flex-1 border-none bg-transparent px-5 py-3.5 text-base placeholder-gray-400 outline-none"
                                                disabled={isLoading}
                                            />
                                            <button
                                                onClick={sendMessage}
                                                disabled={!input.trim() || isLoading}
                                                className="mr-1 rounded-xl bg-gray-900 p-3 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer text - Fixed at bottom */}
                <div className="flex-shrink-0 py-3 text-center">
                    <p className="text-xs text-gray-400">{t("bottomText")}</p>
                </div>
            </div>
        </div>
    );
}
