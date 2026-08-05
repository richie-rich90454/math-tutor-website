"use client";

import { useRef, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import InputArea from "@/components/chat/InputArea";
import CommandPalette from "@/components/ui/CommandPalette";
import MessageSkeleton from "@/components/ui/MessageSkeleton";
import BottomSheet from "@/components/ui/BottomSheet";
import Sparkles from "@/components/ui/Sparkles";
import UsageMeter from "@/components/ui/UsageMeter";
import VirtualizedMessages from "@/components/chat/VirtualizedMessages";
import MessageRow from "@/components/chat/MessageRow";
import ChatTools from "@/components/chat/ChatTools";
import LearningCards from "@/components/home/LearningCards";
import ContinueLearning from "@/components/home/ContinueLearning";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ChatSession } from "@/contexts/ChatContext";
import { gsap, useGSAP } from "@/lib/gsap";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatUI } from "@/hooks/useChatUI";

const Sidebar = dynamic(() => import("@/components/ui/Sidebar"), {
    loading: () => <div className="app-sidebar-wrapper is-collapsed" />,
});
const MathParticles = dynamic(() => import("@/components/ui/MathParticles"), {
    ssr: false,
    loading: () => <div className="math-particles-container" aria-hidden="true" />,
});
const ShortcutHelp = dynamic(() => import("@/components/ui/ShortcutHelp"));

export default function Home() {
    const { t } = useLanguage();
    const {
        input,
        setInput,
        pendingImage,
        setPendingImage,
        messages,
        isLoading,
        isStreaming,
        setActiveChatId,
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
        activeChatId,
        togglePin,
    } = useChatMessages();

    const {
        isSidebarOpen,
        setIsSidebarOpen,
        isMobile,
        showShortcuts,
        setShowShortcuts,
        showCommandPalette,
        setShowCommandPalette,
        showScrollBtn,
        feedback,
        handleSidebarToggle,
        scrollToBottom,
        handleFeedback,
    } = useChatUI(
        sendMessage,
        handleNewChat,
        chatMessagesRef,
        messagesEndRef,
        isStreaming,
        messages,
        prevMessagesLenRef,
    );

    const welcomeRef = useRef<HTMLDivElement>(null);
    const contentAreaRef = useRef<HTMLDivElement>(null);
    const scrollBtnRef = useRef<HTMLButtonElement>(null);
    const inputBarRef = useRef<HTMLDivElement>(null);
    const prevStreamingRef = useRef(false);

    // ── GSAP animations ──
    useEffect(() => {
        if (messages.length === 0 && welcomeRef.current) {
            const titleEl = welcomeRef.current.querySelector(".welcome-title");
            const subtitleEl = welcomeRef.current.querySelector(".welcome-subtitle");
            const inputCard = welcomeRef.current.querySelector(".welcome-input-card");
            const tl = gsap.timeline();
            if (titleEl)
                tl.from(titleEl, { y: 30, opacity: 0, duration: 0.6, ease: "power2.out" }, 0);
            if (subtitleEl)
                tl.from(subtitleEl, { y: 30, opacity: 0, duration: 0.6, ease: "power2.out" }, 0.1);
            if (inputCard)
                tl.from(inputCard, { y: 30, opacity: 0, duration: 0.6, ease: "power2.out" }, 0.2);
            // ponytail: prompt buttons use CSS (promptBtnIn) instead of the GSAP
            // timeline — under StrictMode double-mount the staggered tween left
            // them stuck at opacity 0. CSS can never leave them invisible.
            return () => {
                tl.revert();
            };
        }
    }, [messages.length]);

    useGSAP(
        () => {
            if (contentAreaRef.current && messages.length > 0) {
                gsap.fromTo(
                    contentAreaRef.current,
                    { opacity: 0, y: 8 },
                    { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
                );
            }
        },
        { dependencies: [messages.length > 0] },
    );

    const hasMessages = messages.length > 0;
    useEffect(() => {
        if (hasMessages && contentAreaRef.current) {
            const headerBtns = contentAreaRef.current.querySelectorAll(".app-header-btn");
            if (headerBtns.length > 0) {
                gsap.fromTo(
                    headerBtns,
                    { opacity: 0, scale: 0.8, y: -4 },
                    {
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        duration: 0.3,
                        stagger: 0.06,
                        ease: "back.out(1.7)",
                    },
                );
            }
        }
    }, [hasMessages]);

    useEffect(() => {
        if (scrollBtnRef.current && showScrollBtn !== prevStreamingRef.current) {
            prevStreamingRef.current = showScrollBtn;
            gsap.killTweensOf(scrollBtnRef.current);
            if (showScrollBtn) {
                gsap.fromTo(
                    scrollBtnRef.current,
                    { opacity: 0, y: 12, scale: 0.9 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.7)" },
                );
            } else {
                gsap.to(scrollBtnRef.current, {
                    opacity: 0,
                    y: 12,
                    duration: 0.2,
                    ease: "power2.in",
                });
            }
        }
    }, [showScrollBtn]);

    useEffect(() => {
        if (hasMessages && inputBarRef.current) {
            gsap.fromTo(
                inputBarRef.current,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
            );
        }
    }, [hasMessages]);

    // ── Message spring animations ──
    useEffect(() => {
        const prevLen = prevMessagesLenRef.current;
        const newLen = messages.length;
        prevMessagesLenRef.current = newLen;
        if (newLen > prevLen && chatMessagesRef.current) {
            const timer = setTimeout(() => {
                const rows = chatMessagesRef.current!.querySelectorAll(".message-row");
                for (let i = prevLen; i < rows.length; i++) {
                    const row = rows[i] as HTMLElement;
                    gsap.from(row, {
                        opacity: 0,
                        x: row.classList.contains("is-user") ? 40 : -40,
                        duration: 0.5,
                        ease: "elastic.out(1, 0.5)",
                    });
                }
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [messages.length, chatMessagesRef, prevMessagesLenRef]);

    const formatTime = useCallback((d: Date) => {
        if (!(d instanceof Date) || isNaN(d.getTime())) return "";
        return d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
        });
    }, []);

    const onSuggestionClick = useCallback((text: string) => setInput(text), [setInput]);

    const renderedMessages = useMemo(() => {
        return messages.map((message, index) => (
            <MessageRow
                key={message.id}
                message={message}
                isStreaming={isStreaming}
                isLastMessage={index === messages.length - 1}
                formatTime={formatTime}
                onRegenerate={handleRegenerate}
                onFresh={handleFreshAnswer}
                onFeedback={handleFeedback}
                feedbackValue={feedback.get(message.id) || null}
                onEdit={handleEdit}
                editLabel={t("chatEditMessage") || "Edit message"}
                onSuggestionClick={onSuggestionClick}
                onFollowUp={sendMessage}
                onTogglePin={togglePin}
                isPinned={!!message.isPinned}
            />
        ));
    }, [
        messages,
        isStreaming,
        feedback,
        formatTime,
        handleRegenerate,
        handleFreshAnswer,
        handleFeedback,
        handleEdit,
        togglePin,
        t,
        sendMessage,
        onSuggestionClick,
    ]);

    return (
        <div className="app-shell">
            <button
                className="mobile-menu-btn"
                onClick={() => setIsSidebarOpen((v) => !v)}
                aria-label={isSidebarOpen ? t("sidebarMinimize") : t("openMenu")}
                aria-expanded={isSidebarOpen}
            >
                {isSidebarOpen ? (
                    <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    >
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                )}
            </button>

            {isMobile ? (
                <BottomSheet isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
                    <Sidebar
                        isOpen={true}
                        onToggle={handleSidebarToggle}
                        onShowShortcuts={() => setShowShortcuts(true)}
                        onNewChat={handleNewChat}
                        onChatSelect={(chat: ChatSession) => {
                            setActiveChatId(chat.id);
                            setIsLoaded(false);
                            setIsSidebarOpen(false);
                        }}
                    />
                </BottomSheet>
            ) : (
                <>
                    <div
                        className={`sidebar-backdrop ${isMobile && isSidebarOpen ? "is-visible" : ""}`}
                        onClick={() => isMobile && setIsSidebarOpen(false)}
                    />
                    <div
                        className={`app-sidebar-wrapper ${isSidebarOpen ? "is-open" : "is-collapsed"}`}
                    >
                        <Sidebar
                            isOpen={isSidebarOpen}
                            onToggle={handleSidebarToggle}
                            onShowShortcuts={() => setShowShortcuts(true)}
                            onNewChat={() => {
                                handleNewChat();
                                setIsSidebarOpen(false);
                            }}
                            onChatSelect={(chat: ChatSession) => {
                                setActiveChatId(chat.id);
                                setIsLoaded(false);
                            }}
                        />
                    </div>
                </>
            )}

            <div
                className={`app-main ${isSidebarOpen ? "with-sidebar" : "with-sidebar-collapsed"}`}
            >
                {quotaWarn && (
                    <div className="quota-banner" role="status">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        >
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        {t("quotaWarning") || "You have used 80% of your daily token limit"}
                    </div>
                )}
                <div className="app-header">
                    <div className="app-header-inner">
                        {messages.length > 0 && (
                            <>
                                <button
                                    onClick={handleNewChat}
                                    className="app-header-btn"
                                    aria-label={t("headerNewChat")}
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
                                <button
                                    onClick={() => handleExport("md")}
                                    className="app-header-btn"
                                    aria-label={t("headerExportChat")}
                                    title={t("headerExportAsMD")}
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
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                </button>
                                <ChatTools chatId={activeChatId} />
                            </>
                        )}
                        <ThemeToggle />
                        <LanguageSwitcher />
                    </div>
                </div>

                <ErrorBoundary>
                    <div
                        ref={contentAreaRef}
                        className={`content-area ${messages.length === 0 ? "is-centered" : "is-top"}`}
                    >
                        {messages.length === 0 && (
                            <div className="welcome-section" ref={welcomeRef}>
                                <Sparkles trigger={true} />
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
                                            onSend={pendingImage ? sendImage : sendMessage}
                                            isLoading={isLoading}
                                            isStreaming={isStreaming}
                                            onStop={handleStopGeneration}
                                            placeholder={t("inputPlaceholder")}
                                            onImageSelect={handleImageSelect}
                                            pendingImage={pendingImage}
                                            onClearImage={() => setPendingImage(null)}
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
                                            onClick={() =>
                                                setInput(
                                                    t("examplePracticeProblems") ||
                                                        "Generate 3 practice problems for me at my current level. Make them progressively harder.",
                                                )
                                            }
                                            className="prompt-btn prompt-btn-accent"
                                        >
                                            {t("practiceProblems") || "Practice Problems"}
                                        </button>
                                    </div>
                                    <ContinueLearning onSelect={(text) => sendMessage(text)} />
                                    <LearningCards />
                                </div>
                            </div>
                        )}

                        {messages.length > 0 && (
                            <>
                                <div className="chat-messages-area" ref={chatMessagesRef}>
                                    <div className="chat-messages-inner">
                                        <div className="chat-messages-list">
                                            <VirtualizedMessages scrollRef={chatMessagesRef}>
                                                {renderedMessages}
                                            </VirtualizedMessages>
                                            {isLoading &&
                                                messages[messages.length - 1]?.role === "user" && (
                                                    <MessageSkeleton />
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
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <div className="chat-input-bar" ref={inputBarRef}>
                                    <div className="chat-input-bar-inner">
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
                                                pendingImage={pendingImage}
                                                onClearImage={() => setPendingImage(null)}
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
                    <UsageMeter refreshKey={messages.length} />
                </div>
            </div>

            {showCommandPalette && (
                <CommandPalette
                    isOpen={showCommandPalette}
                    onClose={() => setShowCommandPalette(false)}
                    onNewChat={handleNewChat}
                    onExportChat={handleExport}
                />
            )}
            {showShortcuts && (
                <ShortcutHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
            )}
        </div>
    );
}
