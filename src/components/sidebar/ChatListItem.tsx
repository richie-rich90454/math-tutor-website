"use client";

import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ChatSession } from "@/contexts/ChatContext";

interface ChatListItemProps {
    chat: ChatSession;
    onSelect: (chat: ChatSession) => void;
    onDelete: (chatId: string) => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onLongPress?: (x: number, y: number) => void;
    isHovered: boolean;
    onHover: (id: string | null) => void;
    isActive: boolean;
    isPinned: boolean;
}

export default function ChatListItem({
    chat,
    onSelect,
    onDelete,
    onContextMenu,
    onLongPress,
    isHovered,
    onHover,
    isActive,
    isPinned,
}: ChatListItemProps) {
    const { t } = useLanguage();
    const longPressTimer = useRef<number | null>(null);
    const longPressOrigin = useRef({ x: 0, y: 0 });
    const longPressFired = useRef(false);

    const clearLongPress = () => {
        if (longPressTimer.current !== null) {
            window.clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!onLongPress) return;
        longPressOrigin.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        longPressFired.current = false;
        clearLongPress();
        longPressTimer.current = window.setTimeout(() => {
            longPressFired.current = true;
            onLongPress(longPressOrigin.current.x, longPressOrigin.current.y);
            longPressTimer.current = null;
        }, 500);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const dx = e.touches[0].clientX - longPressOrigin.current.x;
        const dy = e.touches[0].clientY - longPressOrigin.current.y;
        if (Math.hypot(dx, dy) > 10) clearLongPress();
    };

    const handleClick = () => {
        if (longPressFired.current) {
            longPressFired.current = false;
            return;
        }
        onSelect(chat);
    };

    return (
        <div
            data-chat-id={chat.id}
            onClick={handleClick}
            onContextMenu={onContextMenu}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={clearLongPress}
            onTouchCancel={clearLongPress}
            onMouseEnter={() => onHover(chat.id)}
            onMouseLeave={() => onHover(null)}
            className={`sb-chat-item ${isActive ? "is-active" : isHovered ? "is-hovered" : ""}`}
        >
            <div className="sb-chat-item-row">
                <div className="sb-chat-item-dot-wrapper">
                    {isPinned ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--fg-muted)">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                        </svg>
                    ) : (
                        <div className="sb-chat-item-dot" />
                    )}
                </div>
                <div className="sb-chat-item-content">
                    <h4 className="sb-chat-item-title">{chat.title}</h4>
                    <p className="sb-chat-item-preview">{chat.preview}</p>
                </div>
                {isHovered && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(chat.id);
                        }}
                        className="sb-chat-item-delete"
                        aria-label={t("sidebarDelete")}
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
