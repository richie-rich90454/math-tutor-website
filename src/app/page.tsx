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
import CommandPalette from "@/components/ui/CommandPalette";

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

// Parse UTC timestamp string from DB into a Date object
// SQLite datetime('now') returns "YYYY-MM-DD HH:MM:SS" which is UTC
function parseUTCTimestamp(ts: string): Date {
    if (!ts) return new Date();
    // If already ISO format with Z, parse directly
    if (ts.endsWith("Z") || ts.includes("+")) return new Date(ts);
    // Append Z to indicate UTC
    return new Date(ts.replace(" ", "T") + "Z");
}

export default function Home() {
    const { t, currentLanguage } = useLanguage();
    const { currentChat, addChatSession, setCurrentChat, chatHistory, syncChatId } = useChat();
    const { isAuthenticated } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();

    // UI state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<Map<string, "up" | "down">>(new Map());
    const [pendingImage, setPendingImage] = useState<{ data: string; mimeType: string } | null>(null);

    // Chat state
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatMessagesRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const welcomeRef = useRef<HTMLDivElement>(null);
    const contentAreaRef = useRef<HTMLDivElement>(null);
    const prevMessagesLenRef = useRef(0);
    const scrollBtnRef = useRef<HTMLButtonElement>(null);
    const loadingDotsRef = useRef<HTMLDivElement>(null);
    const inputBarRef = useRef<HTMLDivElement>(null);
    const prevStreamingRef = useRef(false);

    // ── Responsive sidebar ──
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 1024);
            if (width >= 1024) setIsSidebarOpen(true);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleSidebarToggle = useCallback(() => {
        if (window.innerWidth < 1024) setIsSidebarOpen((p) => !p);
    }, []);

    // ── Scroll helpers ──
    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }, []);

    const isNearBottom = useCallback(() => {
        const el = chatMessagesRef.current;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    }, []);

    useEffect(() => {
        if (isNearBottom() || isStreaming) scrollToBottom(false);
    }, [messages, isStreaming, scrollToBottom, isNearBottom]);

    useEffect(() => {
        const el = chatMessagesRef.current;
        if (!el) return;
        const handler = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
        el.addEventListener("scroll", handler, { passive: true });
        return () => el.removeEventListener("scroll", handler);
    }, [messages.length]);

    // ── GSAP animations ──
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
            if (promptBtns.length) tl.from(promptBtns, { y: 20, opacity: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }, 0.3);
        }
    }, { dependencies: [messages.length], scope: welcomeRef, revertOnUpdate: false });

    useGSAP(() => {
        if (contentAreaRef.current) {
            gsap.fromTo(contentAreaRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
        }
    }, { dependencies: [messages.length] });

    useEffect(() => {
        if (messages.length > 0 && contentAreaRef.current) {
            const headerBtns = contentAreaRef.current.querySelectorAll(".app-header-btn");
            if (headerBtns.length > 0) {
                gsap.fromTo(headerBtns, { opacity: 0, scale: 0.8, y: -4 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, stagger: 0.06, ease: "back.out(1.7)" });
            }
        }
    }, [messages.length > 0]);

    useEffect(() => {
        if (scrollBtnRef.current && showScrollBtn !== prevStreamingRef.current) {
            prevStreamingRef.current = showScrollBtn;
            gsap.killTweensOf(scrollBtnRef.current);
            if (showScrollBtn) {
                gsap.fromTo(scrollBtnRef.current, { opacity: 0, y: 12, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.7)" });
            } else {
                gsap.to(scrollBtnRef.current, { opacity: 0, y: 12, duration: 0.2, ease: "power2.in" });
            }
        }
    }, [showScrollBtn]);

    useEffect(() => {
        if (messages.length > 0 && inputBarRef.current) {
            gsap.fromTo(inputBarRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
        }
    }, [messages.length > 0]);

    useEffect(() => {
        const prevLen = prevMessagesLenRef.current;
        const newLen = messages.length;
        prevMessagesLenRef.current = newLen;
        if (newLen > prevLen && chatMessagesRef.current) {
            const timer = setTimeout(() => {
                const rows = chatMessagesRef.current!.querySelectorAll(".message-row");
                for (let i = prevLen; i < rows.length; i++) {
                    const row = rows[i] as HTMLElement;
                    springIn(row, { from: row.classList.contains("is-user") ? "right" : "left", duration: 0.5 });
                }
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [messages.length]);

    // ── Load messages when selecting a chat from sidebar ──
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

        // Fetch messages from API
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/chats/${currentChat.id}`);
                if (!res.ok || cancelled) return;
                const data = await res.json();
                if (cancelled) return;
                const formatted = (data.messages || []).map((msg: any) => ({
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
        return () => { cancelled = true; };
    }, [currentChat, isLoaded]);

    // Reset isLoaded when currentChat becomes null (new chat)
    useEffect(() => {
        if (!currentChat) {
            setIsLoaded(false);
            setMessages([]);
            setActiveChatId(null);
            prevMessagesLenRef.current = 0;
        }
    }, [currentChat]);

    // ── Core: Send message ──
    const sendMessage = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        const currentInput = input;
        setInput("");
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);
        setIsStreaming(true);

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
            setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }]);

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                if (!chunk) continue;
                setMessages((prev) =>
                    prev.map((m) => m.id === assistantId ? { ...m, content: m.content + chunk } : m)
                );
            }
        } catch (error: any) {
            if (error.name === "AbortError") return;
            console.error("Send error:", error);
            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: error.message || "Failed to send message",
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    }, [input, isLoading, currentLanguage.code, activeChatId]);

    // ── Send image ──
    const sendImage = useCallback(async () => {
        if (!pendingImage || isLoading) return;

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
            setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }]);

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                if (!chunk) continue;
                setMessages((prev) =>
                    prev.map((m) => m.id === assistantId ? { ...m, content: m.content + chunk } : m)
                );
            }
        } catch (error: any) {
            if (error.name === "AbortError") return;
            console.error("Send image error:", error);
            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: error.message || "Failed to send image",
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    }, [pendingImage, isLoading, input, currentLanguage.code, activeChatId]);

    const handleStopGeneration = useCallback(() => {
        abortControllerRef.current?.abort();
        setIsLoading(false);
        setIsStreaming(false);
    }, []);

    const handleRegenerate = useCallback(async () => {
        if (messages.length < 2 || isLoading) return;
        const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
        if (!lastUserMsg) return;
        setMessages((prev) => {
            const lastUserIdx = prev.map((m) => m.role).lastIndexOf("user");
            return lastUserIdx >= 0 ? prev.slice(0, lastUserIdx + 1) : prev;
        });
        setInput(lastUserMsg.content);
        setTimeout(() => sendMessage(), 0);
    }, [messages, isLoading, sendMessage]);

    const handleFeedback = useCallback((msgId: string, type: "up" | "down") => {
        setFeedback((prev) => {
            const next = new Map(prev);
            if (next.get(msgId) === type) next.delete(msgId);
            else next.set(msgId, type);
            return next;
        });
    }, []);

    const handleExport = useCallback((format: "md" | "txt") => {
        if (messages.length === 0) return;
        const title = currentChat?.title || "Math Chat";
        const msgs = messages.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp.toISOString() }));
        if (format === "md") {
            downloadFile(exportChatAsMarkdown(msgs, title), `${title.replace(/[^a-zA-Z0-9]/g, "_")}.md`, "text/markdown");
        } else {
            downloadFile(exportChatAsText(msgs, title), `${title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`, "text/plain");
        }
        addToast("success", t("chatExportSuccess").replace("%s", format.toUpperCase()));
    }, [messages, currentChat, addToast, t]);

    const handleImageSelect = useCallback((imageData: string, mimeType: string) => {
        setPendingImage({ data: imageData, mimeType });
    }, []);

    const handleNewChat = useCallback(() => {
        setMessages([]);
        setCurrentChat(null);
        setActiveChatId(null);
        setIsLoaded(false);
        setPendingImage(null);
    }, [setCurrentChat]);

    // ── Keyboard shortcuts ──
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey;
            if (mod && e.key === "b") { e.preventDefault(); handleSidebarToggle(); }
            if (mod && e.key === "k") { e.preventDefault(); setShowCommandPalette((v) => !v); }
            if (mod && e.key === "n") { e.preventDefault(); handleNewChat(); }
            if (mod && e.key === "/") { e.preventDefault(); setShowShortcuts((v) => !v); }
            if (mod && e.key === "Enter") { e.preventDefault(); sendMessage(); }
            if (e.key === "Escape") {
                if (showCommandPalette) setShowCommandPalette(false);
                else if (showShortcuts) setShowShortcuts(false);
                else if (window.innerWidth < 1024 && isSidebarOpen) setIsSidebarOpen(false);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handleSidebarToggle, handleNewChat, sendMessage, showCommandPalette, showShortcuts, isSidebarOpen]);

    // ── Render ──
    const formatTime = (d: Date) => {
        if (!(d instanceof Date) || isNaN(d.getTime())) return "";
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
    };

    return (
        <div className="app-shell">
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)} aria-label={t("openMenu")}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            <div className={`sidebar-backdrop ${isSidebarOpen && isMobile ? "is-visible" : ""}`} onClick={() => { if (isMobile) setIsSidebarOpen(false); }} />

            <div className={`app-sidebar-wrapper ${isSidebarOpen ? "is-open" : "is-collapsed"}`}>
                <Sidebar
                    isOpen={isSidebarOpen}
                    onToggle={handleSidebarToggle}
                    onShowShortcuts={() => setShowShortcuts(true)}
                    onChatSelect={(chat: ChatSession) => {
                        setActiveChatId(chat.id);
                        setIsLoaded(false);
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                />
            </div>

            <div className={`app-main ${isSidebarOpen ? "with-sidebar" : "with-sidebar-collapsed"}`}>
                <div className="app-header">
                    <div className="app-header-inner">
                        {messages.length > 0 && (
                            <>
                                <button onClick={handleNewChat} className="app-header-btn" aria-label={t("headerNewChat")}>
                                    <svg className="app-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                                <button onClick={() => handleExport("md")} className="app-header-btn" aria-label={t("headerExportChat")} title={t("headerExportAsMD")}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                </button>
                            </>
                        )}
                        <ThemeToggle />
                        <LanguageSwitcher />
                    </div>
                </div>

                <ErrorBoundary>
                    <div ref={contentAreaRef} className={`content-area ${messages.length === 0 ? "is-centered" : "is-top"}`}>
                        {/* Welcome */}
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
                                            value={input} onChange={setInput} onSend={pendingImage ? sendImage : sendMessage}
                                            isLoading={isLoading} isStreaming={isStreaming} onStop={handleStopGeneration}
                                            placeholder={t("inputPlaceholder")} onImageSelect={handleImageSelect}
                                            pendingImage={pendingImage} onClearImage={() => setPendingImage(null)}
                                        />
                                    </div>
                                    <div className="prompt-buttons">
                                        <button onClick={() => setInput(t("examplePracticeAddition"))} className="prompt-btn">{t("practiceAddition")}</button>
                                        <button onClick={() => setInput(t("exampleLearnGeometry"))} className="prompt-btn">{t("learnGeometry")}</button>
                                        <button onClick={() => setInput(t("exampleTimesTables"))} className="prompt-btn">{t("timesTables")}</button>
                                        <button onClick={() => setInput(t("exampleCulturalExamples"))} className="prompt-btn">{t("culturalExamples")}</button>
                                        <button onClick={() => setInput(t("examplePracticeProblems") || "Generate 3 practice problems for me at my current level. Make them progressively harder.")} className="prompt-btn prompt-btn-accent">{t("practiceProblems") || "Practice Problems"}</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chat */}
                        {messages.length > 0 && (
                            <>
                                <div className="chat-messages-area" ref={chatMessagesRef}>
                                    <div className="chat-messages-inner">
                                        <div className="chat-messages-list">
                                            {messages.map((message, index) => (
                                                <div key={message.id} className={`message-row ${message.role === "user" ? "is-user" : "is-assistant"}`}
                                                    onMouseEnter={() => setHoveredMsgId(message.id)} onMouseLeave={() => setHoveredMsgId(null)}>
                                                    <div className="message-row-bubble-wrapper">
                                                        {message.role === "user" ? (
                                                            <>
                                                                <div className="message-bubble-user"><p>{message.content}</p></div>
                                                                {hoveredMsgId === message.id && !isStreaming && (
                                                                    <button className="msg-edit-btn" onClick={() => { setInput(message.content); setMessages((p) => p.filter((m) => m.id !== message.id)); }}
                                                                        title={t("chatEditMessage") || "Edit message"}>
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                                <span className="message-time is-right">{formatTime(message.timestamp)}</span>
                                                            </>
                                                        ) : (
                                                            <div className="msg-wrapper">
                                                                <MessageActions messageId={message.id} content={message.content}
                                                                    onRegenerate={handleRegenerate} onFeedback={(type) => handleFeedback(message.id, type)}
                                                                    feedback={feedback.get(message.id) || null} isVisible={hoveredMsgId === message.id} />
                                                                <div className="message-bubble-assistant"
                                                                    data-streaming={isStreaming && index === messages.length - 1 ? "true" : undefined}>
                                                                    {message.content ? <MarkdownRenderer content={message.content} /> : <span className="streaming-cursor" />}
                                                                </div>
                                                                <span className="message-time is-left">{formatTime(message.timestamp)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {isLoading && messages[messages.length - 1]?.role === "user" && (
                                                <div className="message-row is-assistant" ref={loadingDotsRef}>
                                                    <div className="loading-dots"><div className="loading-dots-row">
                                                        <div className="loading-dot animate-pulse" />
                                                        <div className="loading-dot animate-pulse" style={{ animationDelay: "150ms" }} />
                                                        <div className="loading-dot animate-pulse" style={{ animationDelay: "300ms" }} />
                                                    </div></div>
                                                </div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </div>
                                    {showScrollBtn && (
                                        <button ref={scrollBtnRef} className="scroll-bottom-btn" onClick={() => scrollToBottom(true)} aria-label={t("chatScrollToBottom")}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <div className="chat-input-bar" ref={inputBarRef}>
                                    <div className="chat-input-bar-inner">
                                        <div className="chat-input-card">
                                            <InputArea
                                                value={input} onChange={setInput} onSend={pendingImage ? sendImage : sendMessage}
                                                isLoading={isLoading} isStreaming={isStreaming} onStop={handleStopGeneration}
                                                placeholder={t("inputPlaceholder")} onImageSelect={handleImageSelect}
                                                pendingImage={pendingImage} onClearImage={() => setPendingImage(null)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </ErrorBoundary>

                <div className="app-footer"><p className="app-footer-text">{t("bottomText")}</p></div>
            </div>

            {showCommandPalette && (
                <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)}
                    onNewChat={handleNewChat} onExportChat={handleExport} />
            )}
            {showShortcuts && <ShortcutHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />}
        </div>
    );
}
