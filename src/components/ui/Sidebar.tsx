"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChat, type ChatSession } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import gsap from "gsap";

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    onChatSelect?: (chat: ChatSession) => void;
    onShowShortcuts?: () => void;
}

interface ContextMenuState {
    x: number;
    y: number;
    chatId: string;
}

export default function Sidebar({ isOpen, onToggle, onChatSelect, onShowShortcuts }: SidebarProps) {
    const { t } = useLanguage();
    const { chatHistory, setCurrentChat, currentChat, deleteChat, renameChat, isHistoryLoading } = useChat();
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
    const [showHistoryTooltip, setShowHistoryTooltip] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [pinnedChats, setPinnedChats] = useState<Set<string>>(new Set());
    const sidebarRef = useRef<HTMLDivElement>(null);

    // ── Responsive: track window width ────────────────────────────────────
    const [windowWidth, setWindowWidth] = useState<number>(() => {
        if (typeof window !== "undefined") return window.innerWidth;
        return 1024;
    });
    const isLargeScreen = windowWidth >= 1024;
    const prevIsLargeScreen = useRef(isLargeScreen);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Auto-expand when the viewport transitions to a large screen
    useEffect(() => {
        if (isLargeScreen && !prevIsLargeScreen.current && !isOpen) {
            onToggle();
        }
        prevIsLargeScreen.current = isLargeScreen;
    }, [isLargeScreen, isOpen, onToggle]);

    // On large screens the sidebar is always rendered open
    const effectiveIsOpen = isLargeScreen || isOpen;

    // ── GSAP width animation on narrow screens ────────────────────────────
    useEffect(() => {
        const wrapper = sidebarRef.current?.parentElement;
        if (!wrapper || isLargeScreen) return;
        gsap.to(wrapper, {
            width: isOpen ? 260 : 60,
            duration: 0.3,
            ease: "power2.inOut",
        });
    }, [isOpen, isLargeScreen]);

    // Swipe to close on mobile
    useEffect(() => {
        const el = sidebarRef.current;
        if (!el) return;
        let startX = 0;
        let movedX = 0;
        let isDragging = false;
        const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; movedX = 0; isDragging = true; };
        const onTouchMove = (e: TouchEvent) => { if (!isDragging) return; movedX = e.touches[0].clientX - startX; };
        const onTouchEnd = () => { if (isDragging && movedX > 80) onToggle(); isDragging = false; };
        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchmove", onTouchMove, { passive: true });
        el.addEventListener("touchend", onTouchEnd);
        return () => { el.removeEventListener("touchstart", onTouchStart); el.removeEventListener("touchmove", onTouchMove); el.removeEventListener("touchend", onTouchEnd); };
    }, [onToggle]);

    // Stagger entrance for sidebar chat items when the sidebar opens or chat history changes
    useEffect(() => {
        if (!effectiveIsOpen || !sidebarRef.current) return;
        const items = sidebarRef.current.querySelectorAll(".sb-chat-item");
        if (items.length > 0) {
            gsap.fromTo(
                items,
                { opacity: 0, x: -12 },
                { opacity: 1, x: 0, duration: 0.3, stagger: 0.03, ease: "power2.out", overwrite: "auto" }
            );
        }
    }, [effectiveIsOpen, chatHistory.length]);

    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return chatHistory;
        const query = searchQuery.toLowerCase();
        return chatHistory.filter(
            (chat) => chat.title.toLowerCase().includes(query) || chat.preview.toLowerCase().includes(query)
        );
    }, [chatHistory, searchQuery]);

    const { pinned, unpinned } = useMemo(() => {
        const p = filteredChats.filter((c) => pinnedChats.has(c.id));
        const u = filteredChats.filter((c) => !pinnedChats.has(c.id));
        return { pinned: p, unpinned: u };
    }, [filteredChats, pinnedChats]);

    const handleChatSelect = useCallback((chat: ChatSession) => {
        setCurrentChat(chat);
        setShowHistoryTooltip(false);
        onChatSelect?.(chat);
    }, [setCurrentChat, onChatSelect]);

    const handleNewChat = useCallback(() => {
        setCurrentChat(null);
        if (typeof window !== "undefined" && window.innerWidth <= 768) {
            onToggle();
        }
    }, [setCurrentChat, onToggle]);

    const handleContextMenu = useCallback((e: React.MouseEvent, chatId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, chatId });
    }, []);

    const handleDeleteChat = useCallback((chatId: string, chatTitle: string) => {
        if (window.confirm(t("sidebarDeleteConfirm").replace("%s", chatTitle))) {
            const item = document.querySelector(`[data-chat-id="${chatId}"]`);
            if (item) {
                gsap.to(item, {
                    height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 0,
                    duration: 0.25, ease: "power2.in",
                    onComplete: () => deleteChat(chatId),
                });
            } else {
                deleteChat(chatId);
            }
        }
        setContextMenu(null);
    }, [deleteChat]);

    const handlePinChat = useCallback((chatId: string) => {
        setPinnedChats((prev) => {
            const next = new Set(prev);
            if (next.has(chatId)) next.delete(chatId);
            else next.add(chatId);
            return next;
        });
        setContextMenu(null);
    }, []);

    useEffect(() => {
        if (!contextMenu) return;
        const handler = () => setContextMenu(null);
        window.addEventListener("click", handler);
        return () => window.removeEventListener("click", handler);
    }, [contextMenu]);

    useEffect(() => {
        if (!showUserDropdown) return;
        const handler = () => setShowUserDropdown(false);
        window.addEventListener("click", handler);
        return () => window.removeEventListener("click", handler);
    }, [showUserDropdown]);

    const groupChatsByDate = (chats: ChatSession[]) => {
        const groups: { [key: string]: ChatSession[] } = { today: [], yesterday: [], thisWeek: [], thisMonth: [], older: [] };
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);
        chats.forEach((chat) => {
            const chatDate = new Date(chat.timestamp);
            if (chatDate >= today) groups.today.push(chat);
            else if (chatDate >= yesterday) groups.yesterday.push(chat);
            else if (chatDate >= weekAgo) groups.thisWeek.push(chat);
            else if (chatDate >= monthAgo) groups.thisMonth.push(chat);
            else groups.older.push(chat);
        });
        return groups;
    };

    const chatGroups = groupChatsByDate(unpinned);
    const userInitials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "?";

    return (
        <>
            <div className="sb-root" ref={sidebarRef}>
                <div className={`sb-header ${effectiveIsOpen ? "is-open" : "is-collapsed"}`}>
                    {effectiveIsOpen && <h2 className="sb-title">{t("sidebarHistory")}</h2>}
                    <button
                        onClick={onToggle}
                        className={`sb-toggle-btn ${isLargeScreen ? "is-disabled" : ""}`}
                        aria-label={effectiveIsOpen ? t("sidebarMinimize") : t("sidebarExpand")}
                    >
                        <svg className="sb-toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {effectiveIsOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            )}
                        </svg>
                    </button>
                </div>

                <div className={`sb-search-section ${effectiveIsOpen ? "is-open" : "is-collapsed"}`}>
                    {effectiveIsOpen ? (
                        <div className="sb-search-wrapper">
                            <svg className="sb-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("sidebarSearchPlaceholder")} className="sb-search-input" />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="sb-search-clear">
                                    <svg className="sb-search-clear-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ) : (
                        <button className="sb-search-collapsed-btn" title={t("sidebarSearchPlaceholder")}>
                            <svg className="sb-search-collapsed-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span className="sb-tooltip">{t("sidebarSearchPlaceholder")}</span>
                        </button>
                    )}
                </div>

                <div className={`sb-new-chat-section ${effectiveIsOpen ? "is-open" : "is-collapsed"}`}>
                    {effectiveIsOpen ? (
                        <button onClick={handleNewChat} className="sb-new-chat-btn">
                            <svg className="sb-new-chat-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {t("sidebarNewChat")}
                        </button>
                    ) : (
                        <button onClick={handleNewChat} className="sb-new-chat-btn-collapsed" title={t("sidebarNewChat")}>
                            <svg className="sb-new-chat-btn-collapsed-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="sb-tooltip">{t("sidebarNewChat")}</span>
                        </button>
                    )}
                </div>

                {effectiveIsOpen ? (
                    <div className="sb-history">
                        {isHistoryLoading ? (
                            <div className="sb-history-list" style={{ padding: "var(--space-3) var(--space-4)" }}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)", alignItems: "flex-start" }}>
                                        <div className="skeleton skeleton-circle" style={{ width: 8, height: 8, marginTop: 6, flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div className="skeleton skeleton-text" style={{ width: "75%", marginBottom: "var(--space-2)" }} />
                                            <div className="skeleton skeleton-text" style={{ width: "60%" }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredChats.length === 0 ? (
                            <div className="sb-history-empty">
                                <svg className="sb-history-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <p className="sb-history-empty-text">{searchQuery ? t("sidebarNoMatchingConversations") : t("sidebarNoConversationsYet")}</p>
                                {!searchQuery && <p className="sb-history-empty-hint">{t("sidebarStartNewChat")}</p>}
                            </div>
                        ) : (
                            <div className="sb-history-list">
                                {pinned.length > 0 && (
                                    <div className="sb-group">
                                        <h3 className="sb-group-title">{t("sidebarPinned")}</h3>
                                        {pinned.map((chat) => (
                                            <ChatItem key={chat.id} chat={chat} onSelect={handleChatSelect} onDelete={(id) => handleDeleteChat(id, chat.title)} onContextMenu={(e) => handleContextMenu(e, chat.id)} isHovered={hoveredChatId === chat.id} onHover={setHoveredChatId} isActive={currentChat?.id === chat.id} isPinned={true} />
                                        ))}
                                    </div>
                                )}
                                {chatGroups.today.length > 0 && (
                                    <div className="sb-group">
                                        <h3 className="sb-group-title">{t("sidebarToday")}</h3>
                                        {chatGroups.today.map((chat) => (
                                            <ChatItem key={chat.id} chat={chat} onSelect={handleChatSelect} onDelete={(id) => handleDeleteChat(id, chat.title)} onContextMenu={(e) => handleContextMenu(e, chat.id)} isHovered={hoveredChatId === chat.id} onHover={setHoveredChatId} isActive={currentChat?.id === chat.id} isPinned={false} />
                                        ))}
                                    </div>
                                )}
                                {chatGroups.yesterday.length > 0 && (
                                    <div className="sb-group">
                                        <h3 className="sb-group-title">{t("sidebarYesterday")}</h3>
                                        {chatGroups.yesterday.map((chat) => (
                                            <ChatItem key={chat.id} chat={chat} onSelect={handleChatSelect} onDelete={(id) => handleDeleteChat(id, chat.title)} onContextMenu={(e) => handleContextMenu(e, chat.id)} isHovered={hoveredChatId === chat.id} onHover={setHoveredChatId} isActive={currentChat?.id === chat.id} isPinned={false} />
                                        ))}
                                    </div>
                                )}
                                {chatGroups.thisWeek.length > 0 && (
                                    <div className="sb-group">
                                        <h3 className="sb-group-title">{t("sidebarThisWeek")}</h3>
                                        {chatGroups.thisWeek.map((chat) => (
                                            <ChatItem key={chat.id} chat={chat} onSelect={handleChatSelect} onDelete={(id) => handleDeleteChat(id, chat.title)} onContextMenu={(e) => handleContextMenu(e, chat.id)} isHovered={hoveredChatId === chat.id} onHover={setHoveredChatId} isActive={currentChat?.id === chat.id} isPinned={false} />
                                        ))}
                                    </div>
                                )}
                                {chatGroups.thisMonth.length > 0 && (
                                    <div className="sb-group">
                                        <h3 className="sb-group-title">{t("sidebarThisMonth")}</h3>
                                        {chatGroups.thisMonth.map((chat) => (
                                            <ChatItem key={chat.id} chat={chat} onSelect={handleChatSelect} onDelete={(id) => handleDeleteChat(id, chat.title)} onContextMenu={(e) => handleContextMenu(e, chat.id)} isHovered={hoveredChatId === chat.id} onHover={setHoveredChatId} isActive={currentChat?.id === chat.id} isPinned={false} />
                                        ))}
                                    </div>
                                )}
                                {chatGroups.older.length > 0 && (
                                    <div className="sb-group">
                                        <h3 className="sb-group-title">{t("sidebarOlder")}</h3>
                                        {chatGroups.older.map((chat) => (
                                            <ChatItem key={chat.id} chat={chat} onSelect={handleChatSelect} onDelete={(id) => handleDeleteChat(id, chat.title)} onContextMenu={(e) => handleContextMenu(e, chat.id)} isHovered={hoveredChatId === chat.id} onHover={setHoveredChatId} isActive={currentChat?.id === chat.id} isPinned={false} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="sb-collapsed-history">
                        <div className="sb-collapsed-history-btn" onMouseEnter={() => setShowHistoryTooltip(true)} onMouseLeave={() => setShowHistoryTooltip(false)}>
                            <svg className="sb-collapsed-history-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="sb-tooltip">{t("sidebarHistory")}</span>
                        </div>
                        {showHistoryTooltip && chatHistory.length > 0 && (
                            <div className="sb-history-tooltip" onMouseEnter={() => setShowHistoryTooltip(true)} onMouseLeave={() => setShowHistoryTooltip(false)}>
                                <div className="sb-history-tooltip-header">
                                    <h3 className="sb-history-tooltip-title">{t("sidebarRecentConversations")}</h3>
                                </div>
                                <div className="sb-history-tooltip-list">
                                    {chatHistory.slice(0, 10).map((chat) => (
                                        <div key={chat.id} onClick={() => handleChatSelect(chat)} className={`sb-history-tooltip-item ${currentChat?.id === chat.id ? "is-active" : ""}`}>
                                            <h4 className="sb-history-tooltip-item-title">{chat.title}</h4>
                                            <p className="sb-history-tooltip-item-preview">{chat.preview}</p>
                                            <span className="sb-history-tooltip-item-date">{new Date(chat.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className={`sb-footer ${!effectiveIsOpen ? "is-collapsed" : ""}`}>
                    {effectiveIsOpen ? (
                        isAuthenticated && user ? (
                            <div className="sb-user-section" onClick={(e) => { e.stopPropagation(); setShowUserDropdown(!showUserDropdown); }}>
                                <div className="sb-user-avatar">{userInitials}</div>
                                <div className="sb-user-info">
                                    <p className="sb-user-name">{user.name}</p>
                                    <p className="sb-user-email">{user.email}</p>
                                </div>
                                {showUserDropdown && (
                                    <div className="sb-user-dropdown" onClick={(e) => e.stopPropagation()}>
                                        <button className="sb-user-dropdown-item" onClick={() => router.push("/settings")}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                                            {t("sidebarSettings")}
                                        </button>
                                        <button className="sb-user-dropdown-item" onClick={() => onShowShortcuts?.()}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></svg>
                                            {t("sidebarShortcuts")}
                                        </button>
                                        <div className="context-menu-divider" />
                                        <button className="sb-user-dropdown-item" onClick={logout} style={{ color: "var(--danger)" }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                            {t("sidebarSignOut")}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button className="sb-sign-in-btn" onClick={() => router.push("/login")}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                                {t("sidebarSignIn")}
                            </button>
                        )
                    ) : (
                        <div className="sb-footer-text">
                            <div className="sb-footer-dot" />
                        </div>
                    )}
                </div>
            </div>

            {contextMenu && (
                <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
                    <button className="context-menu-item" onClick={() => handlePinChat(contextMenu.chatId)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" /></svg>
                        {pinnedChats.has(contextMenu.chatId) ? t("sidebarUnpin") : t("sidebarPinToTop")}
                    </button>
                    <button className="context-menu-item" onClick={() => {
                        const chat = chatHistory.find((c) => c.id === contextMenu.chatId);
                        const newName = window.prompt(t("sidebarRenamePrompt"), chat?.title || "");
                        if (newName && newName.trim()) renameChat(contextMenu.chatId, newName.trim());
                        setContextMenu(null);
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        {t("sidebarRename")}
                    </button>
                    <div className="context-menu-divider" />
                    <button className="context-menu-item is-danger" onClick={() => {
                        const chat = chatHistory.find((c) => c.id === contextMenu.chatId);
                        handleDeleteChat(contextMenu.chatId, chat?.title || "");
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        {t("sidebarDelete")}
                    </button>
                </div>
            )}
        </>
    );
}

function ChatItem({ chat, onSelect, onDelete, onContextMenu, isHovered, onHover, isActive, isPinned }: {
    chat: ChatSession;
    onSelect: (chat: ChatSession) => void;
    onDelete: (chatId: string) => void;
    onContextMenu: (e: React.MouseEvent) => void;
    isHovered: boolean;
    onHover: (id: string | null) => void;
    isActive: boolean;
    isPinned: boolean;
}) {
    const { t } = useLanguage();
    return (
        <div data-chat-id={chat.id} onClick={() => onSelect(chat)} onContextMenu={onContextMenu} onMouseEnter={() => onHover(chat.id)} onMouseLeave={() => onHover(null)} className={`sb-chat-item ${isActive ? "is-active" : isHovered ? "is-hovered" : ""}`}>
            <div className="sb-chat-item-row">
                <div className="sb-chat-item-dot-wrapper">
                    {isPinned ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--fg-muted)"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" /></svg>
                    ) : (
                        <div className="sb-chat-item-dot" />
                    )}
                </div>
                <div className="sb-chat-item-content">
                    <h4 className="sb-chat-item-title">{chat.title}</h4>
                    <p className="sb-chat-item-preview">{chat.preview}</p>
                </div>
                {isHovered && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(chat.id); }} className="sb-chat-item-delete" aria-label={t("sidebarDelete")}>
                        <svg className="sb-chat-item-delete-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}