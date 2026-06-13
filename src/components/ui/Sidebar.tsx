"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChat } from "@/contexts/ChatContext";

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const { t } = useLanguage();
    const { chatHistory, setCurrentChat, currentChat, deleteChat } = useChat();
    const [searchQuery, setSearchQuery] = useState("");
    const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
    const [showHistoryTooltip, setShowHistoryTooltip] = useState(false);

    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return chatHistory;

        const query = searchQuery.toLowerCase();
        return chatHistory.filter(
            (chat) =>
                chat.title.toLowerCase().includes(query) ||
                chat.preview.toLowerCase().includes(query)
        );
    }, [chatHistory, searchQuery]);

    const handleChatSelect = (chat: any) => {
        setCurrentChat(chat);
        setShowHistoryTooltip(false);
    };

    const handleNewChat = () => {
        setCurrentChat(null);
        window.location.reload();
    };

    const groupChatsByDate = (chats: any[]) => {
        const groups: { [key: string]: any[] } = {
            today: [],
            yesterday: [],
            thisWeek: [],
            thisMonth: [],
            older: [],
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        chats.forEach((chat) => {
            const chatDate = new Date(chat.timestamp);

            if (chatDate >= today) {
                groups.today.push(chat);
            } else if (chatDate >= yesterday) {
                groups.yesterday.push(chat);
            } else if (chatDate >= weekAgo) {
                groups.thisWeek.push(chat);
            } else if (chatDate >= monthAgo) {
                groups.thisMonth.push(chat);
            } else {
                groups.older.push(chat);
            }
        });

        return groups;
    };

    const chatGroups = groupChatsByDate(filteredChats);

    return (
        <>
            {/* Main Sidebar - Full height and fixed */}
            <div className="sb-root">
                {/* Header */}
                <div
                    className={`sb-header ${isOpen ? "is-open" : "is-collapsed"}`}
                >
                    {isOpen && (
                        <h2 className="sb-title">
                            {t("sidebarHistory")}
                        </h2>
                    )}
                    <button
                        onClick={onToggle}
                        className="sb-toggle-btn"
                        aria-label={isOpen ? "Minimize sidebar" : "Expand sidebar"}
                    >
                        <svg
                            className="sb-toggle-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {isOpen ? (
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

                {/* Search Section */}
                <div className={`sb-search-section ${isOpen ? "is-open" : "is-collapsed"}`}>
                    {isOpen ? (
                        <div className="sb-search-wrapper">
                            <svg
                                className="sb-search-icon"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t("sidebarSearchPlaceholder")}
                                className="sb-search-input"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="sb-search-clear"
                                >
                                    <svg
                                        className="sb-search-clear-icon"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ) : (
                        <button
                            className="sb-search-collapsed-btn"
                            title="Search"
                        >
                            <svg
                                className="sb-search-collapsed-icon"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <span className="sb-tooltip">
                                {t("sidebarSearchPlaceholder")}
                            </span>
                        </button>
                    )}
                </div>

                {/* New Chat Button */}
                <div className={`sb-new-chat-section ${isOpen ? "is-open" : "is-collapsed"}`}>
                    {isOpen ? (
                        <button
                            onClick={handleNewChat}
                            className="sb-new-chat-btn"
                        >
                            <svg
                                className="sb-new-chat-btn-icon"
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
                            {t("sidebarNewChat")}
                        </button>
                    ) : (
                        <button
                            onClick={handleNewChat}
                            className="sb-new-chat-btn-collapsed"
                            title="New Chat"
                        >
                            <svg
                                className="sb-new-chat-btn-collapsed-icon"
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
                            <span className="sb-tooltip">
                                {t("sidebarNewChat")}
                            </span>
                        </button>
                    )}
                </div>

                {/* Chat History */}
                {isOpen ? (
                    <div className="sb-history">
                        {filteredChats.length === 0 ? (
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
                                    <p className="sb-history-empty-hint">
                                        {t("sidebarStartNewChat")}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="sb-history-list">
                                {/* Today */}
                                {chatGroups.today.length > 0 && (
                                    <div className="sb-group">
                                        <h3 className="sb-group-title">
                                            {t("sidebarToday")}
                                        </h3>
                                        {chatGroups.today.map((chat) => (
                                            <ChatItem
                                                key={chat.id}
                                                chat={chat}
                                                onSelect={handleChatSelect}
                                                onDelete={deleteChat}
                                                isHovered={hoveredChatId === chat.id}
                                                onHover={setHoveredChatId}
                                                isActive={currentChat?.id === chat.id}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Yesterday */}
                                {chatGroups.yesterday.length > 0 && (
                                    <div className="sb-group">
                                        <h3 className="sb-group-title">
                                            {t("sidebarYesterday")}
                                        </h3>
                                        {chatGroups.yesterday.map((chat) => (
                                            <ChatItem
                                                key={chat.id}
                                                chat={chat}
                                                onSelect={handleChatSelect}
                                                onDelete={deleteChat}
                                                isHovered={hoveredChatId === chat.id}
                                                onHover={setHoveredChatId}
                                                isActive={currentChat?.id === chat.id}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* This Week */}
                                {chatGroups.thisWeek.length > 0 && (
                                    <div className="sb-group">
                                        <h3 className="sb-group-title">
                                            {t("sidebarThisWeek")}
                                        </h3>
                                        {chatGroups.thisWeek.map((chat) => (
                                            <ChatItem
                                                key={chat.id}
                                                chat={chat}
                                                onSelect={handleChatSelect}
                                                onDelete={deleteChat}
                                                isHovered={hoveredChatId === chat.id}
                                                onHover={setHoveredChatId}
                                                isActive={currentChat?.id === chat.id}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* This Month */}
                                {chatGroups.thisMonth.length > 0 && (
                                    <div className="sb-group">
                                        <h3 className="sb-group-title">
                                            {t("sidebarThisMonth")}
                                        </h3>
                                        {chatGroups.thisMonth.map((chat) => (
                                            <ChatItem
                                                key={chat.id}
                                                chat={chat}
                                                onSelect={handleChatSelect}
                                                onDelete={deleteChat}
                                                isHovered={hoveredChatId === chat.id}
                                                onHover={setHoveredChatId}
                                                isActive={currentChat?.id === chat.id}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Older */}
                                {chatGroups.older.length > 0 && (
                                    <div className="sb-group">
                                        <h3 className="sb-group-title">
                                            {t("sidebarOlder")}
                                        </h3>
                                        {chatGroups.older.map((chat) => (
                                            <ChatItem
                                                key={chat.id}
                                                chat={chat}
                                                onSelect={handleChatSelect}
                                                onDelete={deleteChat}
                                                isHovered={hoveredChatId === chat.id}
                                                onHover={setHoveredChatId}
                                                isActive={currentChat?.id === chat.id}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="sb-collapsed-history">
                        <div
                            className="sb-collapsed-history-btn"
                            onMouseEnter={() => setShowHistoryTooltip(true)}
                            onMouseLeave={() => setShowHistoryTooltip(false)}
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
                            <span className="sb-tooltip">
                                {t("sidebarHistory")}
                            </span>
                        </div>

                        {/* History Tooltip Popup */}
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
                                            <h4 className="sb-history-tooltip-item-title">
                                                {chat.title}
                                            </h4>
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
                )}

                {/* Footer */}
                <div className={`sb-footer ${!isOpen ? "is-collapsed" : ""}`}>
                    {isOpen ? (
                        <div className="sb-footer-text">
                            <span>{t("sidebarMathTutorAI")}</span>
                        </div>
                    ) : (
                        <div className="sb-footer-text">
                            <div className="sb-footer-dot"></div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

interface ChatItemProps {
    chat: any;
    onSelect: (chat: any) => void;
    onDelete: (chatId: string) => void;
    isHovered: boolean;
    onHover: (id: string | null) => void;
    isActive: boolean;
}

function ChatItem({ chat, onSelect, onDelete, isHovered, onHover, isActive }: ChatItemProps) {
    return (
        <div
            onClick={() => onSelect(chat)}
            onMouseEnter={() => onHover(chat.id)}
            onMouseLeave={() => onHover(null)}
            className={`sb-chat-item ${isActive ? "is-active" : isHovered ? "is-hovered" : ""}`}
        >
            <div className="sb-chat-item-row">
                <div className="sb-chat-item-dot-wrapper">
                    <div className="sb-chat-item-dot" />
                </div>
                <div className="sb-chat-item-content">
                    <h4 className="sb-chat-item-title">
                        {chat.title}
                    </h4>
                    <p className="sb-chat-item-preview">
                        {chat.preview}
                    </p>
                </div>
                {isHovered && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete "${chat.title}"?`)) {
                                onDelete(chat.id);
                            }
                        }}
                        className="sb-chat-item-delete"
                        aria-label="Delete chat"
                    >
                        <svg
                            className="sb-chat-item-delete-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
