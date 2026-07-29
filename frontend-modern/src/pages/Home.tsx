import { useRef, useEffect, useCallback, useState } from 'preact/hooks';
import { useLanguage } from '../contexts/LanguageContext';
import { useChat } from '../hooks/useChat';
import { MessageRow } from '../components/MessageRow';
import { InputArea } from '../components/InputArea';
import { Sidebar } from '../components/Sidebar';
import { ThemeToggle } from '../components/ThemeToggle';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import type { ChatSession } from '../types/chat';

export function Home() {
    const { t } = useLanguage();
    const { messages, input, setInput, isLoading, isStreaming, sendMessage, clearMessages, handleStopGeneration, handleRegenerate } = useChat();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
    const welcomeRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatMessagesRef = useRef<HTMLDivElement>(null);
    const hasMessages = messages.length > 0;

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        const el = chatMessagesRef.current;
        if (!el) return;
        const handleScroll = () => {
            const threshold = el.scrollHeight - el.clientHeight - 200;
            setShowScrollBtn(el.scrollTop < threshold);
        };
        el.addEventListener('scroll', handleScroll);
        return () => el.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const handleSidebarToggle = useCallback(() => {
        setIsSidebarOpen(v => !v);
    }, []);

    const handleChatSelect = useCallback((chat: ChatSession) => {
        console.log('Chat selected:', chat.id);
    }, []);

    const handleNewChat = useCallback(() => {
        clearMessages();
    }, [clearMessages]);

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
        console.log('Feedback:', msgId, type);
    }, []);

    const handleEdit = useCallback((messageId: string, content: string) => {
        console.log('Edit:', messageId, content);
    }, []);

    return (
        <div class="app-shell">
            <button class="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)} aria-label={t('openMenu')}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            <div class={`sidebar-backdrop ${isSidebarOpen ? 'is-visible' : ''}`} onClick={() => setIsSidebarOpen(false)} />

            <div class={`app-sidebar-wrapper ${isSidebarOpen ? 'is-open' : 'is-collapsed'}`}>
                <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} onChatSelect={handleChatSelect} />
            </div>

            <div class={`app-main ${isSidebarOpen ? 'with-sidebar' : 'with-sidebar-collapsed'}`}>
                <div class="app-header">
                    <div class="app-header-inner">
                        {hasMessages && (
                            <>
                                <button onClick={handleNewChat} class="app-header-btn" aria-label={t('headerNewChat')}>
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M12 4v16m8-8H4" /></svg>
                                </button>
                                <button onClick={() => handleExport('md')} class="app-header-btn" aria-label={t('headerExportChat')}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                </button>
                            </>
                        )}
                        <ThemeToggle />
                        <LanguageSwitcher />
                    </div>
                </div>

                <div class={`content-area ${!hasMessages ? 'is-centered' : 'is-top'}`}>
                    {!hasMessages && (
                        <div class="welcome-section" ref={welcomeRef}>
                            <div class="welcome-heading">
                                <h1 class="welcome-title">{t('title')}</h1>
                                <p class="welcome-subtitle">{t('subtitle')}</p>
                            </div>
                            <div class="welcome-input-wrapper">
                                <div class="welcome-input-card">
                                    <InputArea
                                        value={input}
                                        onChange={setInput}
                                        onSend={() => sendMessage(input)}
                                        isLoading={isLoading}
                                        isStreaming={isStreaming}
                                        onStop={handleStopGeneration}
                                        placeholder={t('inputPlaceholder')}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {hasMessages && (
                        <div class="chat-messages-area" ref={chatMessagesRef}>
                            <div class="chat-messages-inner">
                                <div class="chat-messages-list">
                                    {messages.map((msg, i) => (
                                        <MessageRow
                                            key={msg.id}
                                            message={msg}
                                            isHovered={hoveredMsgId === msg.id}
                                            isStreaming={isStreaming}
                                            isLastMessage={i === messages.length - 1}
                                            formatTime={formatTime}
                                            onRegenerate={handleRegenerate}
                                            onFeedback={handleFeedback}
                                            feedbackValue={null}
                                            onEdit={handleEdit}
                                            editLabel={t('chatEditMessage')}
                                            onMouseEnter={() => setHoveredMsgId(msg.id)}
                                            onMouseLeave={() => setHoveredMsgId(null)}
                                        />
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                            {showScrollBtn && (
                                <button class="scroll-bottom-btn" onClick={scrollToBottom} aria-label={t('chatScrollToBottom')}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
                                </button>
                            )}
                        </div>
                    )}

                    {hasMessages && (
                        <div class="chat-input-bar">
                            <div class="chat-input-bar-inner">
                                <div class="chat-input-card">
                                    <InputArea
                                        value={input}
                                        onChange={setInput}
                                        onSend={() => sendMessage(input)}
                                        isLoading={isLoading}
                                        isStreaming={isStreaming}
                                        onStop={handleStopGeneration}
                                        placeholder={t('inputPlaceholder')}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div class="app-footer">
                    <p class="app-footer-text">{t('bottomText')}</p>
                </div>
            </div>
        </div>
    );
}
