"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChat } from "@/contexts/ChatContext";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

interface Message {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
}

export default function ChatInterface() {
    const { t, currentLanguage } = useLanguage();
    const { currentChat, setCurrentChat } = useChat();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load messages from current chat when it changes
    useEffect(() => {
        if (currentChat && currentChat.messages) {
            const formattedMessages = currentChat.messages.map((msg) => ({
                id: msg.id,
                content: msg.content,
                role: msg.role,
                timestamp: new Date(msg.timestamp),
            }));
            setMessages(formattedMessages);

            // If there's only one message (from landing page), automatically get AI response
            if (formattedMessages.length === 1 && formattedMessages[0].role === "user") {
                handleAutoResponse(formattedMessages[0].content);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentChat]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resize textarea
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // Save current position
        const savedPosition = textarea.selectionStart;

        // Reset to get accurate scrollHeight
        textarea.style.height = "48px";
        textarea.style.overflow = "hidden";

        // Calculate new height
        let newHeight = textarea.scrollHeight;

        // Apply constraints
        newHeight = Math.max(48, Math.min(newHeight, 120));

        // Set new height
        textarea.style.height = `${newHeight}px`;

        // Show scrollbar only if content exceeds max height
        if (textarea.scrollHeight > 120) {
            textarea.style.overflowY = "auto";
        } else {
            textarea.style.overflowY = "hidden";
        }

        // Restore cursor position
        textarea.setSelectionRange(savedPosition, savedPosition);
    }, []);

    // Handle input changes
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setInput(e.target.value);
            // Immediately adjust height after state update
            setTimeout(() => adjustTextareaHeight(), 0);
        },
        [adjustTextareaHeight]
    );

    // Adjust on mount
    useEffect(() => {
        adjustTextareaHeight();
    }, [adjustTextareaHeight]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            adjustTextareaHeight();
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustTextareaHeight]);

    const handleAutoResponse = async (userMessage: string) => {
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat/message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: userMessage,
                    preferredLanguage: currentLanguage.code,
                }),
            });

            if (!response.ok) {
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
            if (!reader) throw new Error("No response body");
            const decoder = new TextDecoder();

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
            console.error("Error getting auto response:", error);

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

        // Reset textarea height after clearing
        setTimeout(() => {
            adjustTextareaHeight();
        }, 0);

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
            if (!reader) throw new Error("No response body");
            const decoder = new TextDecoder();

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
        <div className="flex h-screen flex-col bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white px-4 py-3">
                <div className="mx-auto flex max-w-3xl items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setCurrentChat(null)}
                            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                        >
                            <svg
                                className="h-5 w-5 text-gray-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <div>
                            <h2 className="font-semibold text-gray-900">
                                {currentChat?.title || "Math Chat"}
                            </h2>
                            <p className="text-sm text-gray-500">AI Math Tutor</p>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">{currentChat?.timestamp}</div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white px-4 py-6">
                <div className="mx-auto max-w-3xl space-y-4">
                    {messages.length === 0 && (
                        <div className="mt-20 text-center">
                            <div className="mb-8">
                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                                    <svg
                                        className="h-10 w-10 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-medium text-gray-900">
                                    Start a math conversation
                                </h3>
                                <p className="mb-8 text-sm text-gray-500">
                                    Ask me anything about mathematics
                                </p>
                            </div>
                            <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
                                <button className="rounded-xl border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50">
                                    <p className="text-sm font-medium text-gray-900">Basic Math</p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Addition, subtraction...
                                    </p>
                                </button>
                                <button className="rounded-xl border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50">
                                    <p className="text-sm font-medium text-gray-900">Fractions</p>
                                    <p className="mt-1 text-xs text-gray-500">Learn about parts</p>
                                </button>
                                <button className="rounded-xl border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50">
                                    <p className="text-sm font-medium text-gray-900">Geometry</p>
                                    <p className="mt-1 text-xs text-gray-500">Shapes and angles</p>
                                </button>
                                <button className="rounded-xl border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50">
                                    <p className="text-sm font-medium text-gray-900">
                                        Word Problems
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">Real-world math</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map((message) =>
                        message.role === "user" ? (
                            <div key={message.id} className="flex justify-end">
                                <div className="group relative max-w-[70%]">
                                    <div className="rounded-2xl bg-gray-900 px-4 py-3 text-white">
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {message.content}
                                        </p>
                                    </div>
                                    <span className="mt-1 block px-2 text-right text-xs text-gray-400">
                                        {message.timestamp.toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div key={message.id} className="mb-4">
                                <MarkdownRenderer content={message.content} />
                                <span className="mt-1 block text-xs text-gray-400">
                                    {message.timestamp.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                        )
                    )}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div>
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

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white px-4 py-4">
                <div className="mx-auto max-w-3xl">
                    <div className="flex items-end space-x-3">
                        <div className="relative flex-1">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={handleInputChange}
                                onInput={() => adjustTextareaHeight()}
                                onKeyPress={handleKeyPress}
                                placeholder={t("inputPlaceholder")}
                                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 pr-12 text-sm focus:border-transparent focus:ring-2 focus:ring-gray-900 focus:outline-none"
                                rows={1}
                                style={{
                                    height: "48px",
                                    minHeight: "48px",
                                    maxHeight: "120px",
                                    overflowX: "hidden",
                                    overflowY: "hidden",
                                    lineHeight: "1.5",
                                }}
                                disabled={isLoading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 bottom-2 rounded-lg bg-gray-900 p-2 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <svg
                                    width="18"
                                    height="18"
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
                    <div className="mt-2 flex items-center justify-between">
                        <div className="flex space-x-2">
                            <button className="p-1.5 text-gray-400 transition-colors hover:text-gray-600">
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                    />
                                </svg>
                            </button>
                        </div>
                        <span className="text-xs text-gray-400">Press Enter to send</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
