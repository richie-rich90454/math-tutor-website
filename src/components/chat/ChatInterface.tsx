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

    // Auto-response handler (declared before useEffect that calls it)
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

    // Load messages from current chat when it changes
    useEffect(() => {
        if (currentChat && currentChat.messages) {
            const formattedMessages = currentChat.messages.map((msg) => ({
                id: msg.id,
                content: msg.content,
                role: msg.role,
                timestamp: new Date(msg.timestamp),
            }));
            // eslint-disable-next-line react-hooks/set-state-in-effect
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="ci-root">
            {/* Header */}
            <div className="ci-header">
                <div className="ci-header-inner">
                    <div className="ci-header-left">
                        <button
                            onClick={() => setCurrentChat(null)}
                            className="ci-back-btn"
                        >
                            <svg
                                className="ci-back-icon"
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
                            <h2 className="ci-title">
                                {currentChat?.title || "Math Chat"}
                            </h2>
                            <p className="ci-subtitle">AI Math Tutor</p>
                        </div>
                    </div>
                    <div className="ci-timestamp">{currentChat?.timestamp}</div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="ci-messages-area">
                <div className="ci-messages-inner">
                    {messages.length === 0 && (
                        <div className="ci-empty-state">
                            <div className="ci-empty-body">
                                <div className="ci-empty-icon-circle">
                                    <svg
                                        className="ci-empty-icon"
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
                                <h3 className="ci-empty-title">
                                    Start a math conversation
                                </h3>
                                <p className="ci-empty-subtitle">
                                    Ask me anything about mathematics
                                </p>
                            </div>
                            <div className="ci-suggestion-grid">
                                <button className="ci-suggestion-btn">
                                    <p className="ci-suggestion-title">Basic Math</p>
                                    <p className="ci-suggestion-desc">
                                        Addition, subtraction...
                                    </p>
                                </button>
                                <button className="ci-suggestion-btn">
                                    <p className="ci-suggestion-title">Fractions</p>
                                    <p className="ci-suggestion-desc">Learn about parts</p>
                                </button>
                                <button className="ci-suggestion-btn">
                                    <p className="ci-suggestion-title">Geometry</p>
                                    <p className="ci-suggestion-desc">Shapes and angles</p>
                                </button>
                                <button className="ci-suggestion-btn">
                                    <p className="ci-suggestion-title">
                                        Word Problems
                                    </p>
                                    <p className="ci-suggestion-desc">Real-world math</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map((message) =>
                        message.role === "user" ? (
                            <div key={message.id} className="ci-user-row">
                                <div className="ci-user-wrapper">
                                    <div className="ci-user-bubble">
                                        <p>
                                            {message.content}
                                        </p>
                                    </div>
                                    <span className="ci-user-time">
                                        {message.timestamp.toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div key={message.id} className="ci-assistant-row">
                                <MarkdownRenderer content={message.content} />
                                <span className="ci-assistant-time">
                                    {message.timestamp.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                        )
                    )}

                    {isLoading && (
                        <div className="ci-loading-row">
                            <div>
                                <div className="ci-loading-dots">
                                    <div className="ci-loading-dot animate-pulse"></div>
                                    <div
                                        className="ci-loading-dot animate-pulse"
                                        style={{ animationDelay: "150ms" }}
                                    ></div>
                                    <div
                                        className="ci-loading-dot animate-pulse"
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
            <div className="ci-input-area">
                <div className="ci-input-inner">
                    <div className="ci-input-row">
                        <div className="ci-textarea-wrapper">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={handleInputChange}
                                onInput={() => adjustTextareaHeight()}
                                onKeyDown={handleKeyDown}
                                placeholder={t("inputPlaceholder")}
                                className="ci-textarea"
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
                                className="ci-send-btn"
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
                    <div className="ci-input-bottom">
                        <div className="ci-attach-btns">
                            <button className="ci-attach-btn">
                                <svg
                                    className="ci-attach-icon"
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
                        <span className="ci-hint">Press Enter to send</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
