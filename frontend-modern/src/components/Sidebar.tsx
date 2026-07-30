import { useSidebar } from '../hooks/useSidebar';
import SearchBar from '../components/SearchBar';
import ChatList from '../components/ChatList';
import UserArea from '../components/UserArea';
import type { ChatSession } from '../types/chat';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    onChatSelect?: (chat: ChatSession) => void;
    onShowShortcuts?: () => void;
}

export function Sidebar({ isOpen, onToggle, onChatSelect, onShowShortcuts }: SidebarProps) {
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
        pinnedChats,
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

    return (
        <>
            <div class="sb-root" ref={sidebarRef}>
                <div class={`sb-header ${effectiveIsOpen ? "is-open" : "is-collapsed"}`}>
                    {effectiveIsOpen && <h2 class="sb-title">{t("sidebarHistory")}</h2>}
                    <button
                        onClick={onToggle}
                        class={`sb-toggle-btn ${isLargeScreen ? "is-disabled" : ""}`}
                        aria-label={effectiveIsOpen ? t("sidebarMinimize") : t("sidebarExpand")}
                        aria-expanded={effectiveIsOpen}
                    >
                        <svg
                            class="sb-toggle-icon"
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

                <SearchBar
                    effectiveIsOpen={effectiveIsOpen}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleNewChat={handleNewChat}
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
                <div class="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
                    <button
                        class="context-menu-item"
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
                        {pinnedChats.has(contextMenu.chatId)
                            ? t("sidebarUnpin")
                            : t("sidebarPinToTop")}
                    </button>
                    <button
                        class="context-menu-item"
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
                    <div class="context-menu-divider" />
                    <button
                        class="context-menu-item is-danger"
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
                <div class="shortcut-modal-backdrop" onClick={() => setPendingDelete(null)}>
                    <div
                        class="shortcut-modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: 360 }}
                    >
                        <div class="shortcut-modal-header">
                            <h2 class="shortcut-modal-title">
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
                                class="error-boundary-btn error-boundary-btn-secondary"
                            >
                                {t("authBack") || "Cancel"}
                            </button>
                            <button
                                onClick={confirmDelete}
                                class="error-boundary-btn"
                                style={{ background: "var(--danger)" }}
                            >
                                {t("sidebarDelete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {pendingRename && (
                <div class="shortcut-modal-backdrop" onClick={() => setPendingRename(null)}>
                    <div
                        class="shortcut-modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: 360 }}
                    >
                        <div class="shortcut-modal-header">
                            <h2 class="shortcut-modal-title">{t("sidebarRename")}</h2>
                        </div>
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.currentTarget.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && renameValue.trim()) {
                                    renameChat(pendingRename.chatId, renameValue.trim());
                                    setPendingRename(null);
                                }
                                if (e.key === "Escape") setPendingRename(null);
                            }}
                            class="auth-input"
                            style={{ width: "100%", marginBottom: "var(--space-4)" }}
                            autoFocus
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
                                class="error-boundary-btn error-boundary-btn-secondary"
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
                                class="error-boundary-btn"
                            >
                                {t("sidebarRename")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
