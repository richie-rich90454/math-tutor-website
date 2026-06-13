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
                            className="group relative sb-search-collapsed-btn"
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
                            <span className="sb-tooltip group-hover:opacity-100">
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
                            className="group relative sb-new-chat-btn-collapsed"
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
                            <span className="sb-tooltip group-hover:opacity-100">
                                {t("sidebarNewChat")}
                            </span>
                        </button>
                    )}
                </div>

                {/* Chat History */}
                {isOpen ? (
                    <div className="flex-1 overflow-y-auto bg-white">
                        {filteredChats.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center p-8 text-gray-400">
                                <svg
                                    className="mb-3 h-12 w-12"
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
                                <p className="text-center text-sm">
                                    {searchQuery
                                        ? t("sidebarNoMatchingConversations")
                                        : t("sidebarNoConversationsYet")}
                                </p>
                                {!searchQuery && (
                                    <p className="mt-1 text-center text-xs">
                                        {t("sidebarStartNewChat")}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="py-2">
                                {/* Today */}
                                {chatGroups.today.length > 0 && (
                                    <div className="mb-1">
                                        <h3 className="px-4 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
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
                                    <div className="mb-1">
                                        <h3 className="px-4 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
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
                                    <div className="mb-1">
                                        <h3 className="px-4 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
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
                                    <div className="mb-1">
                                        <h3 className="px-4 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
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
                                    <div className="mb-1">
                                        <h3 className="px-4 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
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
                    <div className="relative flex flex-1 flex-col items-center bg-white pt-4">
                        <div
                            className="group relative cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
                            onMouseEnter={() => setShowHistoryTooltip(true)}
                            onMouseLeave={() => setShowHistoryTooltip(false)}
                        >
                            <svg
                                className="h-5 w-5 text-gray-600"
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
                            <span className="pointer-events-none absolute left-full z-50 ml-2 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                                {t("sidebarHistory")}
                            </span>
                        </div>

                        {/* History Tooltip Popup */}
                        {showHistoryTooltip && chatHistory.length > 0 && (
                            <div
                                className="absolute top-0 left-full z-50 ml-2 max-h-[600px] w-72 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
                                onMouseEnter={() => setShowHistoryTooltip(true)}
                                onMouseLeave={() => setShowHistoryTooltip(false)}
                            >
                                <div className="border-b border-gray-200 bg-gray-50 p-3">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        {t("sidebarRecentConversations")}
                                    </h3>
                                </div>
                                <div className="max-h-[540px] overflow-y-auto">
                                    {chatHistory.slice(0, 10).map((chat) => (
                                        <div
                                            key={chat.id}
                                            onClick={() => handleChatSelect(chat)}
                                            className={`cursor-pointer border-b border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50 ${
                                                currentChat?.id === chat.id ? "bg-gray-100" : ""
                                            }`}
                                        >
                                            <h4 className="mb-1 truncate text-sm font-medium text-gray-900">
                                                {chat.title}
                                            </h4>
                                            <p className="line-clamp-2 text-xs text-gray-500">
                                                {chat.preview}
                                            </p>
                                            <span className="mt-1 block text-xs text-gray-400">
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
                <div className={`border-t border-gray-200 bg-white p-4 ${!isOpen && "px-2"}`}>
                    {isOpen ? (
                        <div className="flex items-center justify-center text-xs text-gray-400">
                            <span>{t("sidebarMathTutorAI")}</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-gray-400"></div>
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
            className={`group relative cursor-pointer px-4 py-3 transition-all duration-200 ${
                isActive ? "bg-gray-200" : isHovered ? "bg-gray-100" : "hover:bg-gray-50"
            }`}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                    <div
                        className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                            isActive ? "bg-gray-900" : isHovered ? "bg-gray-700" : "bg-gray-300"
                        }`}
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="mb-1 truncate text-sm font-medium text-gray-900">
                        {chat.title}
                    </h4>
                    <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
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
                        className="group flex-shrink-0 rounded p-1 transition-colors hover:bg-red-100"
                        aria-label="Delete chat"
                    >
                        <svg
                            className="h-4 w-4 text-gray-500 group-hover:text-red-600"
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
