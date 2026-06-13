"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import Sidebar from "@/components/ui/Sidebar";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import InputArea from "@/components/chat/InputArea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChat, ChatSession } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { exportChatAsMarkdown, exportChatAsText, downloadFile } from "@/lib/export";
import { gsap, useGSAP, springIn, particleBurst } from "@/lib/gsap";

const MarkdownRenderer = dynamic(() => import("@/components/ui/MarkdownRenderer"), {
    loading: () => <div className="skeleton" style={{ height: 60, borderRadius: "var(--radius-md)" }} />,
});
const MathParticles = dynamic(() => import("@/components/ui/MathParticles"), {
    ssr: false,
    loading: () => <div className="math-particles-container" aria-hidden="true" />,
});
const MessageActions = dynamic(() => import("@/components/chat/MessageActions"));
const ShortcutHelp = dynamic(() => import("@/components/ui/ShortcutHelp"));

interface Message {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
}

export default function Home() {
    const { t, currentLanguage } = useLanguage();
    const { currentChat, addChatSession, setCurrentChat, chatHistory } = useChat();
    const { isAuthenticated } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [feedback, setFeedback] = useState<Map<string, "up" | "down">>(new Map());
    const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatMessagesRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMobileRef = useRef(false);
    const welcomeRef = useRef<HTMLDivElement>(null);
    const contentAreaRef = useRef<HTMLDivElement>(null);
    const prevMessagesLenRef = useRef(0);

    // Responsive sidebar: track width, force open at >= 1024px, allow toggling below
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            isMobileRef.current = width <= 768;
            if (width >= 1024) {
                setIsSidebarOpen(true);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleSidebarToggle = useCallback(() => {
        if (window.innerWidth < 1024) {
            setIsSidebarOpen((prev) => !prev);
        }
    }, []);

    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }, []);

    const isNearBottom = useCallback(() => {
        const el = chatMessagesRef.current;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    }, []);

    useEffect(() => {
        if (isNearBottom() || isStreaming) {
            scrollToBottom(false);
        }
    }, [messages, isStreaming, scrollToBottom, isNearBottom]);

    useEffect(() => {
        const el = chatMessagesRef.current;
        if (!el) return;
        const handler = () => {
            setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
        };
        el.addEventListener("scroll", handler, { passive: true });
        return () => el.removeEventListener("scroll", handler);
    }, [messages.length]);

    // Welcome section stagger animation
    useGSAP(() => {
        if (messages.length === 0 && welcomeRef.current) {
            const tl = gsap.timeline();
            const titleEl = welcomeRef.current.querySelector(".welcome-title");
            const subtitleEl = welcomeRef.current.querySelector(".welcome-subtitle");
            const promptBtns = welcomeRef.current.querySelectorAll(".prompt-btn");
            const inputCard = welcomeRef.current.querySelector(".welcome-input-card");

            if (titleEl) tl.from(titleEl, { y: 30, opacity: 0, duration: 0.6, ease: "power2.out" }, 0);
            if (subtitleEl) tl.from(subtitleEl, { y: 30, opacity: 0, duration: 0.6, ease: "power2.out" }, 0.1);
            if (inputCard) tl.from(inputCard, { y: 30, opacity: 0, duration: 0.6, ease: "power2.out" }, 0.2);
            if (promptBtns.length) {
                tl.from(promptBtns, { y: 20, opacity: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }, 0.3);
            }
        }
    }, { dependencies: [messages.length], scope: welcomeRef, revertOnUpdate: false });

    // Smooth content area transition when switching between welcome and chat views
    useGSAP(() => {
        if (contentAreaRef.current) {
            gsap.fromTo(
                contentAreaRef.current,
                { opacity: 0, y: 8 },
                { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
            );
        }
    }, { dependencies: [messages.length] });

    // Animate new message bubbles with springIn
    useEffect(() => {
        const prevLen = prevMessagesLenRef.current;
        const newLen = messages.length;
        prevMessagesLenRef.current = newLen;

        if (newLen > prevLen && chatMessagesRef.current) {
            const timer = setTimeout(() => {
                const rows = chatMessagesRef.current!.querySelectorAll(".message-row");
                for (let i = prevLen; i < rows.length; i++) {
                    const row = rows[i] as HTMLElement;
                    const isUser = row.classList.contains("is-user");
                    springIn(row, { from: isUser ? "right" : "left", duration: 0.5 });
                }
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [messages.length]);

    // Load messages from current chat when it changes
    useEffect(() => {
        if (currentChat && currentChat.messages) {
            const formattedMessages = currentChat.messages.map((msg) => ({
                id: msg.id,
                content: msg.content,
                role: msg.role as "user" | "assistant",
                timestamp: new Date(msg.timestamp),
            }));
            queueMicrotask(() => {
                setMessages(formattedMessages);
                prevMessagesLenRef.current = formattedMessages.length;
            });
        } else {
            queueMicrotask(() => {
                setMessages([]);
                prevMessagesLenRef.current = 0;
            });
        }
    }, [currentChat]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        // Particle burst effect on send button
        const sendBtn = document.querySelector<HTMLElement>(".ia-send-btn");
        if (sendBtn) particleBurst(sendBtn);

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
        setIsStreaming(true);

        if (messages.length === 0 && !activeChatId) {
            const newChat: ChatSession = {
                id: Date.now().toString(),
                title: currentInput.slice(0, 30) + (currentInput.length > 30 ? "..." : ""),
                timestamp: new Date().toISOString(),
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
            setActiveChatId(newChat.id);
            addChatSession(newChat);
            setCurrentChat(newChat);
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

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

            if (!response.ok) {
                if (response.status === 401) {
                    addToast("error", t("toastSignInRequired"));
                    router.push("/login");
                    return;
                }
                let errMsg = t("toastFailedResponse");
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
            if (error.name === "AbortError") return;

            console.error("Error sending message:", error);
            addToast("error", error.message || t("toastFailedSend"));

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: error.message || t("toastGenericError"),
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey;

            if (mod && e.key === "b") {
                e.preventDefault();
                handleSidebarToggle();
            }
            if (mod && e.key === "n") {
                e.preventDefault();
                setMessages([]);
                setCurrentChat(null);
                setActiveChatId(null);
            }
            if (mod && e.key === "/") {
                e.preventDefault();
                setShowShortcuts((v) => !v);
            }
            if (mod && e.key === "Enter") {
                e.preventDefault();
                sendMessage();
            }
            if (e.key === "Escape") {
                if (showShortcuts) {
                    setShowShortcuts(false);
                } else if (window.innerWidth < 1024 && isSidebarOpen) {
                    setIsSidebarOpen(false);
                }
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    });

    const handleStopGeneration = useCallback(() => {
        abortControllerRef.current?.abort();
        setIsLoading(false);
        setIsStreaming(false);
    }, []);

    const handleRegenerate = useCallback(async () => {
        if (messages.length < 2) return;
        const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
        if (!lastUserMsg) return;

        setMessages((prev) => prev.filter((m) => m.role !== "assistant" || m.id === prev[prev.length - 1].id ? false : true));
        setInput(lastUserMsg.content);
        setTimeout(() => sendMessage(), 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages]);

    const handleFeedback = useCallback((msgId: string, type: "up" | "down") => {
        setFeedback((prev) => {
            const next = new Map(prev);
            if (next.get(msgId) === type) {
                next.delete(msgId);
            } else {
                next.set(msgId, type);
            }
            return next;
        });
    }, []);

    const handleExport = useCallback((format: "md" | "txt") => {
        if (messages.length === 0) return;
        const title = currentChat?.title || "Math Chat";
        const msgs = messages.map((m) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp.toISOString(),
        }));

        if (format === "md") {
            const md = exportChatAsMarkdown(msgs, title);
            downloadFile(md, `${title.replace(/[^a-zA-Z0-9]/g, "_")}.md`, "text/markdown");
        } else {
            const txt = exportChatAsText(msgs, title);
            downloadFile(txt, `${title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`, "text/plain");
        }
        addToast("success", t("chatExportSuccess").replace("%s", format.toUpperCase()));
    }, [messages, currentChat, addToast, t]);

    return (
        <div className="app-shell">
            {/* Mobile hamburger */}
            <button
                className="mobile-menu-btn"
                onClick={() => setIsSidebarOpen(true)}
                aria-label={t("openMenu")}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {/* Mobile backdrop */}
            <div
                className={`sidebar-backdrop ${isSidebarOpen ? "is-visible" : ""}`}
                onClick={() => {
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
            />

            {/* Sidebar */}
            <div className={`app-sidebar-wrapper ${isSidebarOpen ? "is-open" : "is-collapsed"}`}>
                <Sidebar
                    isOpen={isSidebarOpen}
                    onToggle={handleSidebarToggle}
                    onShowShortcuts={() => setShowShortcuts(true)}
                    onChatSelect={(chat: ChatSession) => {
                        setActiveChatId(chat.id);
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                />
            </div>

            {/* Main Content */}
            <div className={`app-main ${isSidebarOpen ? "with-sidebar" : "with-sidebar-collapsed"}`}>
                {/* Header */}
                <div className="app-header">
                    <div className="app-header-inner">
                        {messages.length > 0 && (
                            <>
                                <button
                                    onClick={() => {
                                        setMessages([]);
                                        setCurrentChat(null);
                                        setActiveChatId(null);
                                    }}
                                    className="app-header-btn"
                                    aria-label={t("headerNewChat")}
                                >
                                    <svg className="app-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleExport("md")}
                                    className="app-header-btn"
                                    aria-label={t("headerExportChat")}
                                    title={t("headerExportAsMD")}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                </button>
                            </>
                        )}
                        <ThemeToggle />
                        <LanguageSwitcher />
                    </div>
                </div>

                {/* Dynamic Content Area */}
                <ErrorBoundary>
                    <div
                        ref={contentAreaRef}
                        className={`content-area ${messages.length === 0 ? "is-centered" : "is-top"}`}
                    >
                        {/* Welcome State */}
                        {messages.length === 0 && (
                            <div className="welcome-section" ref={welcomeRef}>
                                <MathParticles />
                                <div className="welcome-heading">
                                    <h1 className="welcome-title">{t("title")}</h1>
                                    <p className="welcome-subtitle">{t("subtitle")}</p>
                                </div>

                                <div className="welcome-input-wrapper">
                                    <div className="welcome-input-card">
                                        <InputArea
                                            value={input}
                                            onChange={setInput}
                                            onSend={sendMessage}
                                            isLoading={isLoading}
                                            isStreaming={isStreaming}
                                            onStop={handleStopGeneration}
                                            placeholder={t("inputPlaceholder")}
                                        />
                                    </div>

                                    <div className="prompt-buttons">
                                        <button
                                            onClick={() => setInput(t("examplePracticeAddition"))}
                                            className="prompt-btn"
                                        >
                                            {t("practiceAddition")}
                                        </button>
                                        <button
                                            onClick={() => setInput(t("exampleLearnGeometry"))}
                                            className="prompt-btn"
                                        >
                                            {t("learnGeometry")}
                                        </button>
                                        <button
                                            onClick={() => setInput(t("exampleTimesTables"))}
                                            className="prompt-btn"
                                        >
                                            {t("timesTables")}
                                        </button>
                                        <button
                                            onClick={() => setInput(t("exampleCulturalExamples"))}
                                            className="prompt-btn"
                                        >
                                            {t("culturalExamples")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chat Messages */}
                        {messages.length > 0 && (
                            <>
                                <div className="chat-messages-area" ref={chatMessagesRef}>
                                    <div className="chat-messages-inner">
                                        <div className="chat-messages-list">
                                            {messages.map((message, index) => (
                                                <div
                                                    key={message.id}
                                                    className={`message-row ${message.role === "user" ? "is-user" : "is-assistant"}`}
                                                    onMouseEnter={() => setHoveredMsgId(message.id)}
                                                    onMouseLeave={() => setHoveredMsgId(null)}
                                                >
                                                    <div className="message-row-bubble-wrapper">
                                                        {message.role === "user" ? (
                                                            <>
                                                                <div className="message-bubble-user">
                                                                    <p>{message.content}</p>
                                                                </div>
                                                                <span className="message-time is-right">
                                                                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <div className="msg-wrapper">
                                                                <MessageActions
                                                                    messageId={message.id}
                                                                    content={message.content}
                                                                    onRegenerate={handleRegenerate}
                                                                    onFeedback={(type) => handleFeedback(message.id, type)}
                                                                    feedback={feedback.get(message.id) || null}
                                                                    isVisible={hoveredMsgId === message.id}
                                                                />
                                                                <div className="message-bubble-assistant">
                                                                    <MarkdownRenderer content={message.content} />
                                                                    {isStreaming && index === messages.length - 1 && message.role === "assistant" && (
                                                                        <span className="streaming-cursor" />
                                                                    )}
                                                                </div>
                                                                <span className="message-time is-left">
                                                                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {isLoading && messages[messages.length - 1]?.role === "user" && (
                                                <div className="message-row is-assistant">
                                                    <div className="loading-dots">
                                                        <div className="loading-dots-row">
                                                            <div className="loading-dot animate-pulse" />
                                                            <div className="loading-dot animate-pulse" style={{ animationDelay: "150ms" }} />
                                                            <div className="loading-dot animate-pulse" style={{ animationDelay: "300ms" }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </div>

                                    {showScrollBtn && (
                                        <button
                                            className="scroll-bottom-btn"
                                            onClick={() => scrollToBottom(true)}
                                            aria-label={t("chatScrollToBottom")}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                <div className="chat-input-bar">
                                    <div className="chat-input-bar-inner">
                                        <div className="chat-input-card">
                                            <InputArea
                                                value={input}
                                                onChange={setInput}
                                                onSend={sendMessage}
                                                isLoading={isLoading}
                                                isStreaming={isStreaming}
                                                onStop={handleStopGeneration}
                                                placeholder={t("inputPlaceholder")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </ErrorBoundary>

                <div className="app-footer">
                    <p className="app-footer-text">{t("bottomText")}</p>
                </div>
            </div>

            {showShortcuts && (
                <ShortcutHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
            )}
        </div>
    );
}