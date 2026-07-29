import { useRef, useMemo, useEffect, useCallback, useState } from 'preact/hooks';
import { useLanguage } from '../contexts/LanguageContext';
import { useChat } from '../hooks/useChat';
import { MessageRow } from '../components/MessageRow';
import { MessageSkeleton } from '../components/MessageSkeleton';
import { InputArea } from '../components/InputArea';
import { Sidebar } from '../components/Sidebar';
import { ThemeToggle } from '../components/ThemeToggle';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { CommandPalette } from '../components/CommandPalette';
import { ShortcutHelp } from '../components/ShortcutHelp';
import { BottomSheet } from '../components/BottomSheet';
import { Sparkles } from '../components/Sparkles';
import { MathParticles } from '../components/MathParticles';
import { VirtualizedMessages } from '../components/VirtualizedMessages';
import { gsap, useGSAP } from '../lib/gsap';
import type { ChatSession } from '../types/chat';

export function Home() {
    const { t } = useLanguage();
    const { messages, input, setInput, pendingImage, setPendingImage, isLoading, isStreaming, sendMessage, handleStopGeneration, handleRegenerate, clearMessages } = useChat();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
    const feedbackMap = useRef(new Map<string, 'up' | 'down'>());
    const welcomeRef = useRef<HTMLDivElement>(null);
    const contentAreaRef = useRef<HTMLDivElement>(null);
    const scrollBtnRef = useRef<HTMLButtonElement>(null);
    const inputBarRef = useRef<HTMLDivElement>(null);
    const chatMessagesRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevMessagesLenRef = useRef(0);
    const prevStreamingRef = useRef(false);
    const hasMessages = messages.length > 0;

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const el = chatMessagesRef.current;
        if (!el) return;
        const onScroll = () => {
            const threshold = el.scrollHeight - el.clientHeight - 200;
            setShowScrollBtn(el.scrollTop < threshold);
        };
        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, []);

    useGSAP(() => {
        if (messages.length === 0 && welcomeRef.current) {
            const tl = gsap.timeline();
            const titleEl = welcomeRef.current.querySelector('.welcome-title');
            const subtitleEl = welcomeRef.current.querySelector('.welcome-subtitle');
            const promptBtns = welcomeRef.current.querySelectorAll('.prompt-btn');
            const inputCard = welcomeRef.current.querySelector('.welcome-input-card');
            if (titleEl) tl.from(titleEl, { y: 30, opacity: 0, duration: 0.6, ease: 'power2.out' }, 0);
            if (subtitleEl) tl.from(subtitleEl, { y: 30, opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.1);
            if (inputCard) tl.from(inputCard, { y: 30, opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.2);
            if (promptBtns.length) tl.from(promptBtns, { y: 20, opacity: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }, 0.3);
        }
    }, { dependencies: [messages.length], scope: welcomeRef.current ?? undefined });

    useEffect(() => {
        if (contentAreaRef.current && messages.length > 0) {
            gsap.fromTo(contentAreaRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
        }
    }, [messages.length > 0]);

    useEffect(() => {
        if (hasMessages && contentAreaRef.current) {
            const headerBtns = contentAreaRef.current.querySelectorAll('.app-header-btn');
            if (headerBtns.length > 0) {
                gsap.fromTo(headerBtns, { opacity: 0, scale: 0.8, y: -4 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, stagger: 0.06, ease: 'back.out(1.7)' });
            }
        }
    }, [messages.length > 0]);

    useEffect(() => {
        if (scrollBtnRef.current && showScrollBtn !== prevStreamingRef.current) {
            prevStreamingRef.current = showScrollBtn;
            gsap.killTweensOf(scrollBtnRef.current);
            if (showScrollBtn) {
                gsap.fromTo(scrollBtnRef.current, { opacity: 0, y: 12, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.7)' });
            } else {
                gsap.to(scrollBtnRef.current, { opacity: 0, y: 12, duration: 0.2, ease: 'power2.in' });
            }
        }
    }, [showScrollBtn]);

    useEffect(() => {
        if (hasMessages && inputBarRef.current) {
            gsap.fromTo(inputBarRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
        }
    }, [hasMessages]);

    useEffect(() => {
        const prevLen = prevMessagesLenRef.current;
        const newLen = messages.length;
        prevMessagesLenRef.current = newLen;
        if (newLen > prevLen && chatMessagesRef.current) {
            setTimeout(() => {
                const rows = chatMessagesRef.current!.querySelectorAll('.message-row');
                for (let i = prevLen; i < rows.length; i++) {
                    const row = rows[i] as HTMLElement;
                    gsap.from(row, { opacity: 0, x: row.classList.contains('is-user') ? 40 : -40, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
                }
            }, 0);
        }
    }, [messages.length, chatMessagesRef, prevMessagesLenRef]);

    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }, []);

    const handleSidebarToggle = useCallback(() => setIsSidebarOpen(v => !v), []);

    const handleChatSelect = useCallback((_chat: ChatSession) => {
        setIsSidebarOpen(false);
    }, []);

    const handleNewChat = useCallback(() => { clearMessages(); }, [clearMessages]);

    const handleExport = useCallback((format: string) => {
        const text = messages.map(m => `**${m.role}**: ${m.content}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export.${format === 'md' ? 'md' : 'txt'}`;
        a.click();
        URL.revokeObjectURL(url);
    }, [messages]);

    const formatTime = useCallback((d: Date) => {
        if (!(d instanceof Date) || isNaN(d.getTime())) return '';
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, []);

    const handleFeedback = useCallback((msgId: string, type: 'up' | 'down') => {
        feedbackMap.current.set(msgId, type);
    }, []);

    const handleEdit = useCallback((messageId: string, _content: string) => {
        console.log('Edit:', messageId);
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
                feedbackValue={feedbackMap.current.get(message.id) || null}
                onEdit={handleEdit}
                editLabel={t('chatEditMessage') || 'Edit message'}
                onMouseEnter={() => setHoveredMsgId(message.id)}
                onMouseLeave={() => setHoveredMsgId(null)}
            />
        ));
    }, [messages, hoveredMsgId, isStreaming, feedbackMap.current, formatTime, handleRegenerate, handleFeedback, handleEdit, t]);

    const sidebarContent = (
        <Sidebar
            isOpen={true}
            onToggle={handleSidebarToggle}
            onShowShortcuts={() => setShowShortcuts(true)}
            onChatSelect={handleChatSelect}
        />
    );

    return (
        <div class="app-shell">
            <button class="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)} aria-label={t('openMenu')}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {isMobile ? (
                <BottomSheet isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
                    {sidebarContent}
                </BottomSheet>
            ) : (
                <>
                    <div class={`sidebar-backdrop ${isSidebarOpen ? 'is-visible' : ''}`} onClick={() => isMobile && setIsSidebarOpen(false)} />
                    <div class={`app-sidebar-wrapper ${isSidebarOpen ? 'is-open' : 'is-collapsed'}`}>
                        {sidebarContent}
                    </div>
                </>
            )}

            <div class={`app-main ${isSidebarOpen ? 'with-sidebar' : 'with-sidebar-collapsed'}`}>
                <div class="app-header">
                    <div class="app-header-inner">
                        {hasMessages && (
                            <>
                                <button onClick={handleNewChat} class="app-header-btn" aria-label={t('headerNewChat')}>
                                    <svg class="app-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 4v16m8-8H4" /></svg>
                                </button>
                                <button onClick={() => handleExport('md')} class="app-header-btn" aria-label={t('headerExportChat')} title={t('headerExportAsMD')}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                    <div ref={contentAreaRef} class={`content-area ${!hasMessages ? 'is-centered' : 'is-top'}`}>
                        {!hasMessages && (
                            <div class="welcome-section" ref={welcomeRef}>
                                <Sparkles trigger={true} />
                                <MathParticles />
                                <div class="welcome-heading">
                                    <h1 class="welcome-title">{t('title')}</h1>
                                    <p class="welcome-subtitle">{t('subtitle')}</p>
                                </div>
                                <div class="welcome-input-wrapper">
                                    <div class="welcome-input-card">
                                        <InputArea value={input} onChange={setInput} onSend={() => sendMessage(input)} isLoading={isLoading} isStreaming={isStreaming} onStop={handleStopGeneration} placeholder={t('inputPlaceholder')} pendingImage={pendingImage} onClearImage={() => setPendingImage(null)} />
                                    </div>
                                    <div class="prompt-buttons">
                                        <button onClick={() => setInput(t('examplePracticeAddition'))} class="prompt-btn">{t('practiceAddition')}</button>
                                        <button onClick={() => setInput(t('exampleLearnGeometry'))} class="prompt-btn">{t('learnGeometry')}</button>
                                        <button onClick={() => setInput(t('exampleTimesTables'))} class="prompt-btn">{t('timesTables')}</button>
                                        <button onClick={() => setInput(t('exampleCulturalExamples'))} class="prompt-btn">{t('culturalExamples')}</button>
                                        <button onClick={() => setInput(t('examplePracticeProblems') || 'Generate 3 practice problems for me at my current level. Make them progressively harder.')} class="prompt-btn prompt-btn-accent">{t('practiceProblems') || 'Practice Problems'}</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {hasMessages && (
                            <>
                                <div class="chat-messages-area" ref={chatMessagesRef}>
                                    <div class="chat-messages-inner">
                                        <div class="chat-messages-list">
                                            <VirtualizedMessages>{renderedMessages}</VirtualizedMessages>
                                            {isLoading && messages[messages.length - 1]?.role === 'user' && <MessageSkeleton />}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </div>
                                    {showScrollBtn && (
                                        <button ref={scrollBtnRef} class="scroll-bottom-btn" onClick={() => scrollToBottom(true)} aria-label={t('chatScrollToBottom')}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
                                        </button>
                                    )}
                                </div>
                                <div class="chat-input-bar" ref={inputBarRef}>
                                    <div class="chat-input-bar-inner">
                                        <div class="chat-input-card">
                                            <InputArea value={input} onChange={setInput} onSend={() => sendMessage(input)} isLoading={isLoading} isStreaming={isStreaming} onStop={handleStopGeneration} placeholder={t('inputPlaceholder')} pendingImage={pendingImage} onClearImage={() => setPendingImage(null)} />
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
                <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} onNewChat={handleNewChat} onExportChat={handleExport} />
            )}
            {showShortcuts && (
                <ShortcutHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
            )}
        </div>
    );
}
