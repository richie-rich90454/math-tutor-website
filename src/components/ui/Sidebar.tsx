"use client";

import { useRef, useEffect } from "react";
import { useSidebar } from "@/hooks/useSidebar";
import FocusTrap from "@/components/ui/FocusTrap";
import Link from "next/link";
import SearchBar from "@/components/sidebar/SearchBar";
import ChatList from "@/components/sidebar/ChatList";
import UserArea from "@/components/sidebar/UserArea";
import type { ChatSession } from "@/contexts/ChatContext";

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    onChatSelect?: (chat: ChatSession) => void;
    onShowShortcuts?: () => void;
    onNewChat?: () => void;
}

export default function Sidebar({
    isOpen,
    onToggle,
    onChatSelect,
    onShowShortcuts,
    onNewChat,
}: SidebarProps) {
    const {
        sidebarRef,
        searchQuery,
        setSearchQuery,
        hoveredChatId,
        setHoveredChatId,
        showHistoryTooltip,
        setShowHistoryTooltip,
        contextMenu,
        setContextMenu,
        showUserDropdown,
        setShowUserDropdown,
        pendingDelete,
        setPendingDelete,
        pendingRename,
        setPendingRename,
        renameValue,
        setRenameValue,
        effectiveIsOpen,
        isLargeScreen,
        filteredChats,
        pinned,
        chatGroups,
        userInitials,
        t,
        chatHistory,
        currentChat,
        isHistoryLoading,
        user,
        isAuthenticated,
        logout,
        renameChat,
        handleChatSelect,
        handleNewChat,
        handleContextMenu,
        handleDeleteChat,
        confirmDelete,
        handlePinChat,
    } = useSidebar({ isOpen, onToggle, onChatSelect, onShowShortcuts });

    const contextMenuRef = useRef<HTMLDivElement>(null);

    // Keyboard support: focus the first menu item when opened, Escape to close.
    useEffect(() => {
        if (contextMenu) {
            const first = contextMenuRef.current?.querySelector(
                ".context-menu-item",
            ) as HTMLElement | null;
            first?.focus();
        }
    }, [contextMenu]);

    useEffect(() => {
        if (!contextMenu) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setContextMenu(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [contextMenu, setContextMenu]);

    return (
        <>
            <div className="sb-root" ref={sidebarRef}>
                <div className={`sb-header ${effectiveIsOpen ? "is-open" : "is-collapsed"}`}>
                    {effectiveIsOpen && <h2 className="sb-title">{t("sidebarHistory")}</h2>}
                    <button
                        onClick={onToggle}
                        className={`sb-toggle-btn ${isLargeScreen ? "is-disabled" : ""}`}
                        aria-label={effectiveIsOpen ? t("sidebarMinimize") : t("sidebarExpand")}
                        aria-expanded={effectiveIsOpen}
                    >
                        <svg
                            className="sb-toggle-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {effectiveIsOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                                />
                            )}
                        </svg>
                    </button>
                </div>

                <div className={`sb-links ${effectiveIsOpen ? "is-open" : "is-collapsed"}`}>
                    <Link href="/practice" className="sb-link">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M9 11l3 3L22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        <span>{t("practiceTitle") || "Practice"}</span>
                    </Link>
                    <Link href="/sheets" className="sb-link">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        <span>{t("sheetsTitle") || "Sheets"}</span>
                    </Link>
                </div>

                <SearchBar
                    effectiveIsOpen={effectiveIsOpen}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleNewChat={onNewChat || handleNewChat}
                />

                <ChatList
                    chatHistory={chatHistory}
                    filteredChats={filteredChats}
                    isHistoryLoading={isHistoryLoading}
                    searchQuery={searchQuery}
                    effectiveIsOpen={effectiveIsOpen}
                    showHistoryTooltip={showHistoryTooltip}
                    setShowHistoryTooltip={setShowHistoryTooltip}
                    pinned={pinned}
                    chatGroups={chatGroups}
                    hoveredChatId={hoveredChatId}
                    setHoveredChatId={setHoveredChatId}
                    currentChat={currentChat}
                    handleChatSelect={handleChatSelect}
                    handleDeleteChat={handleDeleteChat}
                    handleContextMenu={handleContextMenu}
                />

                <UserArea
                    effectiveIsOpen={effectiveIsOpen}
                    isAuthenticated={isAuthenticated}
                    user={user}
                    userInitials={userInitials}
                    showUserDropdown={showUserDropdown}
                    setShowUserDropdown={setShowUserDropdown}
                    logout={logout}
                    onShowShortcuts={onShowShortcuts}
                />
            </div>

            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    role="menu"
                >
                    <button
                        className="context-menu-item"
                        role="menuitem"
                        onClick={() => handlePinChat(contextMenu.chatId)}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                        </svg>
                        {chatHistory.find((c) => c.id === contextMenu.chatId)?.isPinned
                            ? t("sidebarUnpin")
                            : t("sidebarPinToTop")}
                    </button>
                    <button
                        className="context-menu-item"
                        role="menuitem"
                        onClick={() => {
                            const chat = chatHistory.find((c) => c.id === contextMenu.chatId);
                            setPendingRename({
                                chatId: contextMenu.chatId,
                                currentTitle: chat?.title || "",
                            });
                            setRenameValue(chat?.title || "");
                            setContextMenu(null);
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        {t("sidebarRename")}
                    </button>
                    <div className="context-menu-divider" />
                    <button
                        className="context-menu-item is-danger"
                        role="menuitem"
                        onClick={() => {
                            const chat = chatHistory.find((c) => c.id === contextMenu.chatId);
                            handleDeleteChat(contextMenu.chatId, chat?.title || "");
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        {t("sidebarDelete")}
                    </button>
                </div>
            )}

            {pendingDelete && (
                <FocusTrap isActive={!!pendingDelete} onDeactivate={() => setPendingDelete(null)}>
                    <div className="shortcut-modal-backdrop" onClick={() => setPendingDelete(null)}>
                        <div
                            className="shortcut-modal"
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: 360 }}
                        >
                            <div className="shortcut-modal-header">
                                <h2 className="shortcut-modal-title">
                                    {t("sidebarDeleteConfirmTitle")}
                                </h2>
                            </div>
                            <p
                                style={{
                                    fontSize: 14,
                                    color: "var(--fg-secondary)",
                                    marginBottom: "var(--space-6)",
                                }}
                            >
                                {t("sidebarDeleteConfirm").replace("%s", pendingDelete.chatTitle)}
                            </p>
                            <div
                                style={{
                                    display: "flex",
                                    gap: "var(--space-3)",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    onClick={() => setPendingDelete(null)}
                                    className="error-boundary-btn error-boundary-btn-secondary"
                                >
                                    {t("authBack") || "Cancel"}
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="error-boundary-btn"
                                    style={{ background: "var(--danger)" }}
                                >
                                    {t("sidebarDelete")}
                                </button>
                            </div>
                        </div>
                    </div>
                </FocusTrap>
            )}

            {pendingRename && (
                <FocusTrap isActive={!!pendingRename} onDeactivate={() => setPendingRename(null)}>
                    <div className="shortcut-modal-backdrop" onClick={() => setPendingRename(null)}>
                        <div
                            className="shortcut-modal"
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: 360 }}
                        >
                            <div className="shortcut-modal-header">
                                <h2 className="shortcut-modal-title">{t("sidebarRename")}</h2>
                            </div>
                            <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && renameValue.trim()) {
                                        renameChat(pendingRename.chatId, renameValue.trim());
                                        setPendingRename(null);
                                    }
                                }}
                                className="auth-input"
                                style={{ width: "100%", marginBottom: "var(--space-4)" }}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    gap: "var(--space-3)",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    onClick={() => setPendingRename(null)}
                                    className="error-boundary-btn error-boundary-btn-secondary"
                                >
                                    {t("authBack") || "Cancel"}
                                </button>
                                <button
                                    onClick={() => {
                                        if (renameValue.trim()) {
                                            renameChat(pendingRename.chatId, renameValue.trim());
                                            setPendingRename(null);
                                        }
                                    }}
                                    className="error-boundary-btn"
                                >
                                    {t("sidebarRename")}
                                </button>
                            </div>
                        </div>
                    </div>
                </FocusTrap>
            )}
        </>
    );
}
