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

export default function Home() {
    const { t, currentLanguage } = useLanguage();
    const { currentChat, addChatSession, setCurrentChat, chatHistory, syncChatId, loadChatHistory } = useChat();
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
    const [isMobile, setIsMobile] = useState(false);
    const [pendingImage, setPendingImage] = useState<{ data: string; mimeType: string } | null>(null);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
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
            setIsMobile(width < 1024);
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

    // Animate header buttons stagger entrance when messages appear
    useGSAP(() => {
        if (messages.length > 0 && contentAreaRef.current) {
            const headerBtns = contentAreaRef.current.querySelectorAll(".app-header-btn");
            if (headerBtns.length > 0) {
                gsap.fromTo(
                    headerBtns,
                    { opacity: 0, scale: 0.8, y: -4 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.3, stagger: 0.06, ease: "back.out(1.7)" }
                );
            }
        }
    }, { dependencies: [messages.length > 0], scope: contentAreaRef, revertOnUpdate: false });

    // Animate scroll-to-bottom button entrance/exit with GSAP
    const scrollBtnRef = useRef<HTMLButtonElement>(null);
    const prevShowScrollRef = useRef(false);
    useEffect(() => {
        if (scrollBtnRef.current && showScrollBtn !== prevShowScrollRef.current) {
            prevShowScrollRef.current = showScrollBtn;
            gsap.killTweensOf(scrollBtnRef.current);
            if (showScrollBtn) {
                gsap.fromTo(scrollBtnRef.current,
                    { opacity: 0, y: 12, scale: 0.9 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.7)" }
                );
            } else {
                gsap.to(scrollBtnRef.current, { opacity: 0, y: 12, duration: 0.2, ease: "power2.in" });
            }
        }
    }, [showScrollBtn]);

    // Animate loading dots with GSAP continuous bounce
    const loadingDotsRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (isLoading && loadingDotsRef.current) {
            const dots = loadingDotsRef.current.querySelectorAll(".loading-dot");
            dots.forEach((dot, i) => {
                gsap.to(dot, {
                    y: -6,
                    duration: 0.5,
                    repeat: -1,
                    yoyo: true,
                    ease: "power1.inOut",
                    delay: i * 0.15,
                });
            });
        }
    }, [isLoading]);

    // Animate chat-input-bar entrance when messages appear
    const inputBarRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (messages.length > 0 && inputBarRef.current) {
            gsap.fromTo(inputBarRef.current,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
            );
        }
    }, [messages.length > 0]);

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

    // ==========================================
    // GSAP Streaming Animations
    // ==========================================

    // Ref to track previous streaming state for completion animation
    const prevStreamingRef = useRef(false);

    // 1. Animate streaming cursor with GSAP (smooth pulse instead of CSS blink)
    useEffect(() => {
        if (isStreaming) {
            const cursor = document.querySelector(".streaming-cursor") as HTMLElement | null;
            if (cursor) {
                gsap.fromTo(
                    cursor,
                    { opacity: 1, scaleY: 1 },
                    {
                        opacity: 0.25,
                        scaleY: 0.6,
                        duration: 0.6,
                        repeat: -1,
                        yoyo: true,
                        ease: "power2.inOut",
                    }
                );
            }
        } else {
            gsap.killTweensOf(".streaming-cursor");
        }
    }, [isStreaming]);

    // 2. Animate streaming message bubble on each new chunk arrival
    const prevContentLenRef = useRef(0);
    useEffect(() => {
        if (isStreaming && messages.length > 0) {
            const last = messages[messages.length - 1];
            if (last.role === "assistant" && last.content.length > prevContentLenRef.current) {
                prevContentLenRef.current = last.content.length;
                const bubble = document.querySelector(
                    `.message-bubble-assistant[data-streaming="true"]`
                ) as HTMLElement | null;
                if (bubble) {
                    // Subtle glow pulse on the bubble when new content arrives
                    gsap.fromTo(
                        bubble,
                        { boxShadow: "0 0 0 0 rgba(96,165,250,0)" },
                        {
                            boxShadow: "0 0 14px 2px rgba(96,165,250,0.08)",
                            duration: 0.12,
                            ease: "power2.out",
                            onComplete: () => {
                                gsap.to(bubble, {
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                                    duration: 0.35,
                                    ease: "power2.out",
                                });
                            },
                        }
                    );
                }
            }
        } else if (!isStreaming) {
            prevContentLenRef.current = 0;
        }
    }, [messages, isStreaming]);

    // 3. Completion animation when streaming finishes
    useEffect(() => {
        if (prevStreamingRef.current && !isStreaming && messages.length > 0) {
            // Find the last assistant message bubble
            const bubbles = document.querySelectorAll(
                '.message-bubble-assistant[data-streaming]'
            ) as NodeListOf<HTMLElement>;
            const lastBubble = bubbles[bubbles.length - 1];
            if (lastBubble) {
                // Remove data-streaming attribute
                lastBubble.removeAttribute("data-streaming");

                // Animate a subtle border highlight then fade
                gsap.to(lastBubble, {
                    borderColor: "var(--accent)",
                    boxShadow: "0 2px 16px rgba(96,165,250,0.1)",
                    duration: 0.35,
                    ease: "power2.out",
                    onComplete: () => {
                        gsap.to(lastBubble, {
                            borderColor: "var(--border-default)",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                            duration: 0.6,
                            ease: "power2.out",
                            delay: 0.5,
                        });
                    },
                });
            }
        }
        prevStreamingRef.current = isStreaming;
    }, [isStreaming, messages.length]);

    // Load messages from current chat when it changes
    useEffect(() => {
        if (!currentChat) {
            queueMicrotask(() => {
                setMessages([]);
                prevMessagesLenRef.current = 0;
            });
            return;
        }

        if (currentChat.messages && currentChat.messages.length > 0) {
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
            return;
        }

        // Messages not loaded yet — fetch from API
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/chats/${currentChat.id}`);
                if (!res.ok || cancelled) return;
                const data = await res.json();
                if (cancelled) return;
                const formattedMessages = (data.messages || []).map((msg: any) => ({
                    id: msg.id,
                    content: msg.content,
                    role: msg.role as "user" | "assistant",
                    timestamp: new Date(msg.created_at),
                }));
                setMessages(formattedMessages);
                prevMessagesLenRef.current = formattedMessages.length;
            } catch {
                if (!cancelled) {
                    setMessages([]);
                    prevMessagesLenRef.current = 0;
                }
            }
        })();

        return () => { cancelled = true; };
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
            if (serverChatId && serverChatId !== activeChatId && activeChatId) {
                syncChatId(activeChatId, serverChatId);
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

            // Don't reload full chat history after every stream — it's slow and causes white flashes.
            // The local state is already up-to-date from streaming.
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

    const sendImage = async () => {
        if (!pendingImage || isLoading) return;

        const sendBtn = document.querySelector<HTMLElement>(".ia-send-btn");
        if (sendBtn) particleBurst(sendBtn);

        const imageMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: `[Image] ${input || "Please solve this math problem"}`,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, imageMessage]);
        const imageData = pendingImage;
        const currentInput = input;
        setInput("");
        setPendingImage(null);
        setIsLoading(true);
        setIsStreaming(true);

        if (messages.length === 0 && !activeChatId) {
            const newChat: ChatSession = {
                id: Date.now().toString(),
                title: (currentInput || "Image question").slice(0, 30),
                timestamp: new Date().toISOString(),
                preview: currentInput || "Image question",
                messages: [
                    {
                        id: imageMessage.id,
                        content: `[Image] ${currentInput || "Please solve this math problem"}`,
                        role: "user" as const,
                        timestamp: imageMessage.timestamp.toISOString(),
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
            if (serverChatId && serverChatId !== activeChatId && activeChatId) {
                syncChatId(activeChatId, serverChatId);
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
            console.error("Error sending image:", error);
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

    const handleImageSelect = useCallback((imageData: string, mimeType: string) => {
        setPendingImage({ data: imageData, mimeType });
    }, []);

    const handleEditMessage = useCallback((messageId: string) => {
        const msg = messages.find((m) => m.id === messageId);
        if (!msg || msg.role !== "user") return;
        setInput(msg.content);
        setEditingMessageId(messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }, [messages]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey;

            if (mod && e.key === "b") {
                e.preventDefault();
                handleSidebarToggle();
            }
            if (mod && e.key === "k") {
                e.preventDefault();
                setShowCommandPalette((v) => !v);
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

        setMessages((prev) => {
            const lastUserIdx = prev.map((m) => m.role).lastIndexOf("user");
            return lastUserIdx >= 0 ? prev.slice(0, lastUserIdx + 1) : prev;
        });
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

            {/* Mobile backdrop - only visible on screens < 1024px */}
            <div
                className={`sidebar-backdrop ${isSidebarOpen && isMobile ? "is-visible" : ""}`}
                onClick={() => {
                    if (isMobile) setIsSidebarOpen(false);
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
                                        {pendingImage && (
                                            <div className="ia-image-preview">
                                                <img src={pendingImage.data} alt="Selected" />
                                                <button className="ia-image-preview-remove" onClick={() => setPendingImage(null)}>&times;</button>
                                            </div>
                                        )}
                                        <InputArea
                                            value={input}
                                            onChange={setInput}
                                            onSend={pendingImage ? sendImage : sendMessage}
                                            isLoading={isLoading}
                                            isStreaming={isStreaming}
                                            onStop={handleStopGeneration}
                                            placeholder={t("inputPlaceholder")}
                                            onImageSelect={handleImageSelect}
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
                                        <button
                                            onClick={() => setInput(t("examplePracticeProblems") || "Generate 3 practice problems for me at my current level. Make them progressively harder.")}
                                            className="prompt-btn prompt-btn-accent"
                                        >
                                            {t("practiceProblems") || "Practice Problems"}
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
                                                                {hoveredMsgId === message.id && !isStreaming && (
                                                                    <button
                                                                        className="msg-edit-btn"
                                                                        onClick={() => handleEditMessage(message.id)}
                                                                        title={t("chatEditMessage") || "Edit message"}
                                                                    >
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                                        </svg>
                                                                    </button>
                                                                )}
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
                                                                <div
                                                                    className="message-bubble-assistant"
                                                                    data-streaming={
                                                                        isStreaming && index === messages.length - 1 && message.role === "assistant"
                                                                            ? "true"
                                                                            : undefined
                                                                    }
                                                                >
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
                                                <div className="message-row is-assistant" ref={loadingDotsRef}>
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
                                            ref={scrollBtnRef}
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

                                <div className="chat-input-bar" ref={inputBarRef}>
                                    <div className="chat-input-bar-inner">
                                        {pendingImage && (
                                            <div className="ia-image-preview">
                                                <img src={pendingImage.data} alt="Selected" />
                                                <button className="ia-image-preview-remove" onClick={() => setPendingImage(null)}>&times;</button>
                                            </div>
                                        )}
                                        <div className="chat-input-card">
                                            <InputArea
                                                value={input}
                                                onChange={setInput}
                                                onSend={pendingImage ? sendImage : sendMessage}
                                                isLoading={isLoading}
                                                isStreaming={isStreaming}
                                                onStop={handleStopGeneration}
                                                placeholder={t("inputPlaceholder")}
                                                onImageSelect={handleImageSelect}
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

            {showCommandPalette && (
                <CommandPalette
                    isOpen={showCommandPalette}
                    onClose={() => setShowCommandPalette(false)}
                    onNewChat={() => { setMessages([]); setCurrentChat(null); setActiveChatId(null); }}
                    onExportChat={handleExport}
                />
            )}

            {showShortcuts && (
                <ShortcutHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
            )}
        </div>
    );
}