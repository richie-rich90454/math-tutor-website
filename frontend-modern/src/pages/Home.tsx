import { useRef, useMemo, useEffect, useCallback } from 'preact/hooks';
import { useLanguage } from '../contexts/LanguageContext';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { gsap, useGSAP } from '../lib/gsap';
import { useChatMessages } from '../hooks/useChatMessages';
import { useChatUI } from '../hooks/useChatUI';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { InputArea } from '../components/InputArea';
import { CommandPalette } from '../components/CommandPalette';
import { MessageSkeleton } from '../components/MessageSkeleton';
import { BottomSheet } from '../components/BottomSheet';
import { Sparkles } from '../components/Sparkles';
import { VirtualizedMessages } from '../components/VirtualizedMessages';
import { MessageRow } from '../components/MessageRow';
import { Sidebar } from '../components/Sidebar';
import { MathParticles } from '../components/MathParticles';
import { ShortcutHelp } from '../components/ShortcutHelp';
import { ThemeToggle } from '../components/ThemeToggle';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import type { ChatSession } from '../types/chat';

export function Home() {
    const { t } = useLanguage();
    const { currentChat: _currentChat, setCurrentChat: _setCurrentChat } = useChat();
    const { isAuthenticated: _isAuthenticated } = useAuth();
    const {
        input,
        setInput,
        pendingImage,
        setPendingImage,
        messages,
        isLoading,
        isStreaming,
        activeChatId: _activeChatId,
        setActiveChatId,
        isLoaded: _isLoaded,
        setIsLoaded,
        sendMessage,
        sendImage,
        handleRegenerate,
        handleStopGeneration,
        handleEdit,
        handleNewChat,
        handleExport,
        handleImageSelect,
        chatMessagesRef,
        messagesEndRef,
        prevMessagesLenRef,
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
        hoveredMsgId,
        setHoveredMsgId,
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
    useGSAP(
        () => {
            if (messages.length === 0 && welcomeRef.current) {
                const tl = gsap.timeline();
                const titleEl = welcomeRef.current.querySelector('.welcome-title');
                const subtitleEl = welcomeRef.current.querySelector('.welcome-subtitle');
                const promptBtns = welcomeRef.current.querySelectorAll('.prompt-btn');
                const inputCard = welcomeRef.current.querySelector('.welcome-input-card');
                if (titleEl)
                    tl.from(titleEl, { y: 30, opacity: 0, duration: 0.6, ease: 'power2.out' }, 0);
                if (subtitleEl)
                    tl.from(
                        subtitleEl,
                        { y: 30, opacity: 0, duration: 0.6, ease: 'power2.out' },
                        0.1,
                    );
                if (inputCard)
                    tl.from(
                        inputCard,
                        { y: 30, opacity: 0, duration: 0.6, ease: 'power2.out' },
                        0.2,
                    );
                if (promptBtns.length)
                    tl.from(
                        promptBtns,
                        { y: 20, opacity: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' },
                        0.3,
                    );
            }
        },
        { dependencies: [messages.length], scope: welcomeRef.current ?? undefined, revertOnUpdate: false },
    );

    useGSAP(
        () => {
            if (contentAreaRef.current && messages.length > 0) {
                gsap.fromTo(
                    contentAreaRef.current,
                    { opacity: 0, y: 8 },
                    { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
                );
            }
        },
        { dependencies: [messages.length > 0] },
    );

    const hasMessages = messages.length > 0;
    useEffect(() => {
        if (hasMessages && contentAreaRef.current) {
            const headerBtns = contentAreaRef.current.querySelectorAll('.app-header-btn');
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
                        ease: 'back.out(1.7)',
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
                    { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.7)' },
                );
            }
            else {
                gsap.to(scrollBtnRef.current, {
                    opacity: 0,
                    y: 12,
                    duration: 0.2,
                    ease: 'power2.in',
                });
            }
        }
    }, [showScrollBtn]);

    useEffect(() => {
        if (hasMessages && inputBarRef.current) {
            gsap.fromTo(
                inputBarRef.current,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
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
                const rows = chatMessagesRef.current!.querySelectorAll('.message-row');
                for (let i = prevLen; i < rows.length; i++) {
                    const row = rows[i] as HTMLElement;
                    gsap.from(row, {
                        opacity: 0,
                        x: row.classList.contains('is-user') ? 40 : -40,
                        duration: 0.5,
                        ease: 'elastic.out(1, 0.5)',
                    });
                }
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [messages.length, chatMessagesRef, prevMessagesLenRef]);

    const formatTime = useCallback((d: Date | string | undefined) => {
        if (!d) return '';
        const date = typeof d === 'string' ? new Date(d) : d;
        if (!(date instanceof Date) || isNaN(date.getTime())) return '';
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
        });
    }, []);

    const renderedMessages = useMemo(() => {
        return messages.map((message, index) => (
            <MessageRow
                key={message.id}
                message={message}
                isHovered={hoveredMsgId === message.id}
                isStreaming={isStreaming}
                isLastMessage={index === messages.length - 1}
                formatTime={formatTime}
                onRegenerate={handleRegenerate}
                onFeedback={handleFeedback}
                feedbackValue={feedback.get(message.id) || null}
                onEdit={handleEdit}
                editLabel={t('chatEditMessage') || 'Edit message'}
                onMouseEnter={() => setHoveredMsgId(message.id)}
                onMouseLeave={() => setHoveredMsgId(null)}
            />
        ));
    }, [
        messages,
        hoveredMsgId,
        isStreaming,
        feedback,
        formatTime,
        handleRegenerate,
        handleFeedback,
        handleEdit,
        t,
        setHoveredMsgId,
    ]);

    return (
        <div class="app-shell">
            <button
                class="mobile-menu-btn"
                onClick={() => setIsSidebarOpen(true)}
                aria-label={t('openMenu')}
            >
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {isMobile ? (
                <BottomSheet isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
                    <Sidebar
                        isOpen={true}
                        onToggle={handleSidebarToggle}
                        onShowShortcuts={() => setShowShortcuts(true)}
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
                        class={`sidebar-backdrop ${isSidebarOpen ? 'is-visible' : ''}`}
                        onClick={() => isMobile && setIsSidebarOpen(false)}
                    />
                    <div
                        class={`app-sidebar-wrapper ${isSidebarOpen ? 'is-open' : 'is-collapsed'}`}
                    >
                        <Sidebar
                            isOpen={isSidebarOpen}
                            onToggle={handleSidebarToggle}
                            onShowShortcuts={() => setShowShortcuts(true)}
                            onChatSelect={(chat: ChatSession) => {
                                setActiveChatId(chat.id);
                                setIsLoaded(false);
                            }}
                        />
                    </div>
                </>
            )}

            <div
                class={`app-main ${isSidebarOpen ? 'with-sidebar' : 'with-sidebar-collapsed'}`}
            >
                <div class="app-header">
                    <div class="app-header-inner">
                        {messages.length > 0 && (
                            <>
                                <button
                                    onClick={handleNewChat}
                                    class="app-header-btn"
                                    aria-label={t('headerNewChat')}
                                >
                                    <svg
                                        class="app-header-icon"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width={2}
                                            d="M12 4v16m8-8H4"
                                        />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleExport('md')}
                                    class="app-header-btn"
                                    aria-label={t('headerExportChat')}
                                    title={t('headerExportAsMD')}
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
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

                <ErrorBoundary>
                    <div
                        ref={contentAreaRef}
                        class={`content-area ${messages.length === 0 ? 'is-centered' : 'is-top'}`}
                    >
                        {messages.length === 0 && (
                            <div class="welcome-section" ref={welcomeRef}>
                                <Sparkles trigger={true} />
                                <MathParticles />
                                <div class="welcome-heading">
                                    <h1 class="welcome-title">{t('title')}</h1>
                                    <p class="welcome-subtitle">{t('subtitle')}</p>
                                </div>
                                <div class="welcome-input-wrapper">
                                    <div class="welcome-input-card">
                                        <InputArea
                                            value={input}
                                            onChange={setInput}
                                            onSend={pendingImage ? sendImage : sendMessage}
                                            isLoading={isLoading}
                                            isStreaming={isStreaming}
                                            onStop={handleStopGeneration}
                                            placeholder={t('inputPlaceholder')}
                                            onImageSelect={handleImageSelect}
                                            pendingImage={pendingImage}
                                            onClearImage={() => setPendingImage(null)}
                                        />
                                    </div>
                                    <div class="prompt-buttons">
                                        <button
                                            onClick={() => setInput(t('examplePracticeAddition'))}
                                            class="prompt-btn"
                                        >
                                            {t('practiceAddition')}
                                        </button>
                                        <button
                                            onClick={() => setInput(t('exampleLearnGeometry'))}
                                            class="prompt-btn"
                                        >
                                            {t('learnGeometry')}
                                        </button>
                                        <button
                                            onClick={() => setInput(t('exampleTimesTables'))}
                                            class="prompt-btn"
                                        >
                                            {t('timesTables')}
                                        </button>
                                        <button
                                            onClick={() => setInput(t('exampleCulturalExamples'))}
                                            class="prompt-btn"
                                        >
                                            {t('culturalExamples')}
                                        </button>
                                        <button
                                            onClick={() =>
                                                setInput(
                                                    t('examplePracticeProblems') ||
                                                        'Generate 3 practice problems for me at my current level. Make them progressively harder.',
                                                )
                                            }
                                            class="prompt-btn prompt-btn-accent"
                                        >
                                            {t('practiceProblems') || 'Practice Problems'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.length > 0 && (
                            <>
                                <div class="chat-messages-area" ref={chatMessagesRef}>
                                    <div class="chat-messages-inner">
                                        <div class="chat-messages-list">
                                            <VirtualizedMessages>
                                                {renderedMessages}
                                            </VirtualizedMessages>
                                            {isLoading &&
                                                messages[messages.length - 1]?.role === 'user' && (
                                                    <MessageSkeleton />
                                                )}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </div>
                                    {showScrollBtn && (
                                        <button
                                            ref={scrollBtnRef}
                                            class="scroll-bottom-btn"
                                            onClick={() => scrollToBottom(true)}
                                            aria-label={t('chatScrollToBottom')}
                                        >
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <div class="chat-input-bar" ref={inputBarRef}>
                                    <div class="chat-input-bar-inner">
                                        <div class="chat-input-card">
                                            <InputArea
                                                value={input}
                                                onChange={setInput}
                                                onSend={pendingImage ? sendImage : sendMessage}
                                                isLoading={isLoading}
                                                isStreaming={isStreaming}
                                                onStop={handleStopGeneration}
                                                placeholder={t('inputPlaceholder')}
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

                <div class="app-footer">
                    <p class="app-footer-text">{t('bottomText')}</p>
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
