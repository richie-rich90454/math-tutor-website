"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChat, type ChatSession } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import gsap from "gsap";

export interface ContextMenuState {
    x: number;
    y: number;
    chatId: string;
}

export interface PendingDelete {
    chatId: string;
    chatTitle: string;
}

export interface PendingRename {
    chatId: string;
    currentTitle: string;
}

interface UseSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    onChatSelect?: (chat: ChatSession) => void;
    onShowShortcuts?: () => void;
}

export function useSidebar({ isOpen, onToggle, onChatSelect, onShowShortcuts }: UseSidebarProps) {
    const { t } = useLanguage();
    const { chatHistory, setCurrentChat, currentChat, deleteChat, renameChat, isHistoryLoading } =
        useChat();
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    const sidebarRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
    const [showHistoryTooltip, setShowHistoryTooltip] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [pinnedChats, setPinnedChats] = useState<Set<string>>(new Set());

    // ── Responsive: track window width ────────────────────────────────────
    const [windowWidth, setWindowWidth] = useState<number>(1024);
    const isLargeScreen = windowWidth > 768;
    const prevIsLargeScreen = useRef(isLargeScreen);

    useEffect(() => {
        setWindowWidth(window.innerWidth);
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
        const onTouchStart = (e: TouchEvent) => {
            startX = e.touches[0].clientX;
            movedX = 0;
            isDragging = true;
        };
        const onTouchMove = (e: TouchEvent) => {
            if (!isDragging) return;
            movedX = e.touches[0].clientX - startX;
        };
        const onTouchEnd = () => {
            if (isDragging && movedX > 80) onToggle();
            isDragging = false;
        };
        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchmove", onTouchMove, { passive: true });
        el.addEventListener("touchend", onTouchEnd);
        return () => {
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchmove", onTouchMove);
            el.removeEventListener("touchend", onTouchEnd);
        };
    }, [onToggle]);

    // Stagger entrance for sidebar chat items
    useEffect(() => {
        if (!effectiveIsOpen || !sidebarRef.current) return;
        const items = sidebarRef.current.querySelectorAll(".sb-chat-item");
        if (items.length > 0) {
            gsap.fromTo(
                items,
                { opacity: 0, x: -12 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.3,
                    stagger: 0.03,
                    ease: "power2.out",
                    overwrite: "auto",
                },
            );
        }
    }, [effectiveIsOpen, chatHistory.length]);

    // ── Search ────────────────────────────────────────────────────────────
    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return chatHistory;
        const query = searchQuery.toLowerCase();
        return chatHistory.filter(
            (chat) =>
                chat.title.toLowerCase().includes(query) ||
                chat.preview.toLowerCase().includes(query),
        );
    }, [chatHistory, searchQuery]);

    const { pinned, unpinned } = useMemo(() => {
        const p = filteredChats.filter((c) => pinnedChats.has(c.id));
        const u = filteredChats.filter((c) => !pinnedChats.has(c.id));
        return { pinned: p, unpinned: u };
    }, [filteredChats, pinnedChats]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleChatSelect = useCallback(
        (chat: ChatSession) => {
            setCurrentChat(chat);
            setShowHistoryTooltip(false);
            onChatSelect?.(chat);
        },
        [setCurrentChat, onChatSelect],
    );

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

    const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
    const [pendingRename, setPendingRename] = useState<PendingRename | null>(null);
    const [renameValue, setRenameValue] = useState("");

    const handleDeleteChat = useCallback((chatId: string, chatTitle: string) => {
        setPendingDelete({ chatId, chatTitle });
    }, []);

    const confirmDelete = useCallback(() => {
        if (!pendingDelete) return;
        const item = document.querySelector(`[data-chat-id="${pendingDelete.chatId}"]`);
        if (item) {
            gsap.to(item, {
                height: 0,
                opacity: 0,
                paddingTop: 0,
                paddingBottom: 0,
                marginBottom: 0,
                duration: 0.25,
                ease: "power2.in",
                onComplete: () => deleteChat(pendingDelete.chatId),
            });
        } else {
            deleteChat(pendingDelete.chatId);
        }
        setPendingDelete(null);
        setContextMenu(null);
    }, [pendingDelete, deleteChat]);

    const handlePinChat = useCallback((chatId: string) => {
        setPinnedChats((prev) => {
            const next = new Set(prev);
            if (next.has(chatId)) next.delete(chatId);
            else next.add(chatId);
            return next;
        });
        setContextMenu(null);
    }, []);

    // Close context menu on outside click
    useEffect(() => {
        if (!contextMenu) return;
        const handler = () => setContextMenu(null);
        window.addEventListener("click", handler);
        return () => window.removeEventListener("click", handler);
    }, [contextMenu]);

    // Close user dropdown on outside click
    useEffect(() => {
        if (!showUserDropdown) return;
        const handler = () => setShowUserDropdown(false);
        window.addEventListener("click", handler);
        return () => window.removeEventListener("click", handler);
    }, [showUserDropdown]);

    // ── Date grouping ─────────────────────────────────────────────────────
    const groupChatsByDate = useCallback((chats: ChatSession[]) => {
        const groups: { [key: string]: ChatSession[] } = {
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
            if (chatDate >= today) groups.today.push(chat);
            else if (chatDate >= yesterday) groups.yesterday.push(chat);
            else if (chatDate >= weekAgo) groups.thisWeek.push(chat);
            else if (chatDate >= monthAgo) groups.thisMonth.push(chat);
            else groups.older.push(chat);
        });
        return groups;
    }, []);

    const chatGroups = groupChatsByDate(unpinned);

    const userInitials = user?.name
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "?";

    return {
        // Refs
        sidebarRef,
        // State
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
        setPinnedChats,
        pendingDelete,
        setPendingDelete,
        pendingRename,
        setPendingRename,
        renameValue,
        setRenameValue,
        // Computed
        effectiveIsOpen,
        isLargeScreen,
        filteredChats,
        pinned,
        unpinned,
        chatGroups,
        userInitials,
        // From contexts
        t,
        router,
        chatHistory,
        currentChat,
        isHistoryLoading,
        user,
        isAuthenticated,
        logout,
        renameChat,
        deleteChat,
        setCurrentChat,
        // Handlers
        handleChatSelect,
        handleNewChat,
        handleContextMenu,
        handleDeleteChat,
        confirmDelete,
        handlePinChat,
    };
}
