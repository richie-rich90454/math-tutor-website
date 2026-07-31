"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { ChatSession } from "@/contexts/ChatContext";
import ChatListItem from "./ChatListItem";

interface ChatListProps {
    chatHistory: ChatSession[];
    filteredChats: ChatSession[];
    isHistoryLoading: boolean;
    searchQuery: string;
    effectiveIsOpen: boolean;
    showHistoryTooltip: boolean;
    setShowHistoryTooltip: (v: boolean) => void;
    pinned: ChatSession[];
    chatGroups: Record<string, ChatSession[]>;
    hoveredChatId: string | null;
    setHoveredChatId: (id: string | null) => void;
    currentChat: ChatSession | null;
    handleChatSelect: (chat: ChatSession) => void;
    handleDeleteChat: (chatId: string, chatTitle: string) => void;
    handleContextMenu: (e: React.MouseEvent, chatId: string) => void;
}

export default function ChatList({
    chatHistory,
    filteredChats,
    isHistoryLoading,
    searchQuery,
    effectiveIsOpen,
    showHistoryTooltip,
    setShowHistoryTooltip,
    pinned,
    chatGroups,
    hoveredChatId,
    setHoveredChatId,
    currentChat,
    handleChatSelect,
    handleDeleteChat,
    handleContextMenu,
}: ChatListProps) {
    const { t } = useLanguage();

    if (!effectiveIsOpen) {
        return (
            <div className="sb-collapsed-history">
                <div
                    className="sb-collapsed-history-btn"
                    onMouseEnter={() => setShowHistoryTooltip(true)}
                    onMouseLeave={() => setShowHistoryTooltip(false)}
                    role="button"
                    tabIndex={0}
                    aria-label={t("sidebarHistory")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setShowHistoryTooltip(true);
                        }
                    }}
                >
                    <svg
                        className="sb-collapsed-history-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span className="sb-tooltip">{t("sidebarHistory")}</span>
                </div>
                {showHistoryTooltip && chatHistory.length > 0 && (
                    <div
                        className="sb-history-tooltip"
                        onMouseEnter={() => setShowHistoryTooltip(true)}
                        onMouseLeave={() => setShowHistoryTooltip(false)}
                    >
                        <div className="sb-history-tooltip-header">
                            <h3 className="sb-history-tooltip-title">
                                {t("sidebarRecentConversations")}
                            </h3>
                        </div>
                        <div className="sb-history-tooltip-list">
                            {chatHistory.slice(0, 10).map((chat) => (
                                <div
                                    key={chat.id}
                                    onClick={() => handleChatSelect(chat)}
                                    className={`sb-history-tooltip-item ${currentChat?.id === chat.id ? "is-active" : ""}`}
                                >
                                    <h4 className="sb-history-tooltip-item-title">{chat.title}</h4>
                                    <p className="sb-history-tooltip-item-preview">
                                        {chat.preview}
                                    </p>
                                    <span className="sb-history-tooltip-item-date">
                                        {new Date(chat.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (isHistoryLoading) {
        return (
            <div className="sb-history">
                <div
                    className="sb-history-list"
                    style={{ padding: "var(--space-3) var(--space-4)" }}
                >
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            style={{
                                display: "flex",
                                gap: "var(--space-3)",
                                marginBottom: "var(--space-4)",
                                alignItems: "flex-start",
                            }}
                        >
                            <div
                                className="skeleton skeleton-circle"
                                style={{
                                    width: 8,
                                    height: 8,
                                    marginTop: 6,
                                    flexShrink: 0,
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <div
                                    className="skeleton skeleton-text"
                                    style={{
                                        width: "75%",
                                        marginBottom: "var(--space-2)",
                                    }}
                                />
                                <div className="skeleton skeleton-text" style={{ width: "60%" }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (filteredChats.length === 0) {
        return (
            <div className="sb-history">
                <div className="sb-history-empty">
                    <svg
                        className="sb-history-empty-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                    </svg>
                    <p className="sb-history-empty-text">
                        {searchQuery
                            ? t("sidebarNoMatchingConversations")
                            : t("sidebarNoConversationsYet")}
                    </p>
                    {!searchQuery && (
                        <p className="sb-history-empty-hint">{t("sidebarStartNewChat")}</p>
                    )}
                </div>
            </div>
        );
    }

    const renderGroup = (label: string, chats: ChatSession[]) => {
        if (chats.length === 0) return null;
        return (
            <div className="sb-group">
                <h3 className="sb-group-title">{label}</h3>
                {chats.map((chat) => (
                    <ChatListItem
                        key={chat.id}
                        chat={chat}
                        onSelect={handleChatSelect}
                        onDelete={(id) => handleDeleteChat(id, chat.title)}
                        onContextMenu={(e) => handleContextMenu(e, chat.id)}
                        onLongPress={(x, y) =>
                            handleContextMenu(
                                {
                                    preventDefault: () => {},
                                    clientX: x,
                                    clientY: y,
                                } as unknown as React.MouseEvent,
                                chat.id,
                            )
                        }
                        isHovered={hoveredChatId === chat.id}
                        onHover={setHoveredChatId}
                        isActive={currentChat?.id === chat.id}
                        isPinned={false}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="sb-history">
            <div className="sb-history-list">
                {pinned.length > 0 && (
                    <div className="sb-group">
                        <h3 className="sb-group-title">{t("sidebarPinned")}</h3>
                        {pinned.map((chat) => (
                            <ChatListItem
                                key={chat.id}
                                chat={chat}
                                onSelect={handleChatSelect}
                                onDelete={(id) => handleDeleteChat(id, chat.title)}
                                onContextMenu={(e) => handleContextMenu(e, chat.id)}
                                onLongPress={(x, y) =>
                                    handleContextMenu(
                                        {
                                            preventDefault: () => {},
                                            clientX: x,
                                            clientY: y,
                                        } as unknown as React.MouseEvent,
                                        chat.id,
                                    )
                                }
                                isHovered={hoveredChatId === chat.id}
                                onHover={setHoveredChatId}
                                isActive={currentChat?.id === chat.id}
                                isPinned={true}
                            />
                        ))}
                    </div>
                )}
                {renderGroup(t("sidebarToday"), chatGroups.today)}
                {renderGroup(t("sidebarYesterday"), chatGroups.yesterday)}
                {renderGroup(t("sidebarThisWeek"), chatGroups.thisWeek)}
                {renderGroup(t("sidebarThisMonth"), chatGroups.thisMonth)}
                {renderGroup(t("sidebarOlder"), chatGroups.older)}
            </div>
        </div>
    );
}
