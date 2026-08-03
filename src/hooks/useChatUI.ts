import { useState, useEffect, useCallback } from "react";

export function useChatUI(
    sendMessage: (overrideInput?: string) => Promise<void>,
    handleNewChat: () => void,
    chatMessagesRef: React.RefObject<HTMLDivElement | null>,
    messagesEndRef: React.RefObject<HTMLDivElement | null>,
    isStreaming: boolean,
    messages: unknown[],
    prevMessagesLenRef: React.MutableRefObject<number>,
) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<Map<string, "up" | "down">>(new Map());

    // Touch devices have no hover, so hover-dependent UI must stay reachable
    useEffect(() => {
        const mq = window.matchMedia("(hover: none)");
        const update = () => setIsTouchDevice(mq.matches);
        update();
        mq.addEventListener?.("change", update);
        return () => mq.removeEventListener?.("change", update);
    }, []);

    // Responsive sidebar
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsMobile(width <= 768);
            if (width > 768) setIsSidebarOpen(true);
            else setIsSidebarOpen(false);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Touch swipe for sidebar
    useEffect(() => {
        if (!isMobile) return;
        let startX = 0;
        let startY = 0;
        const handleTouchStart = (e: TouchEvent) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        };
        const handleTouchEnd = (e: TouchEvent) => {
            const dx = e.changedTouches[0].clientX - startX;
            const dy = e.changedTouches[0].clientY - startY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
                if (dx > 0 && !isSidebarOpen) setIsSidebarOpen(true);
                else if (dx < 0 && isSidebarOpen) setIsSidebarOpen(false);
            }
        };
        document.addEventListener("touchstart", handleTouchStart, { passive: true });
        document.addEventListener("touchend", handleTouchEnd, { passive: true });
        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, [isMobile, isSidebarOpen]);

    const handleSidebarToggle = useCallback(() => {
        if (window.innerWidth <= 768) setIsSidebarOpen((p) => !p);
    }, []);

    // Scroll helpers
    const scrollToBottom = useCallback(
        (smooth = true) => {
            messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
        },
        [messagesEndRef],
    );

    const isNearBottom = useCallback(() => {
        const el = chatMessagesRef.current;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    }, [chatMessagesRef]);

    // Auto-scroll on new messages
    useEffect(() => {
        if (isStreaming && isNearBottom()) scrollToBottom(false);
        else if (!isStreaming && messages.length > prevMessagesLenRef.current) scrollToBottom(true);
    }, [messages, isStreaming, scrollToBottom, isNearBottom, prevMessagesLenRef]);

    // Scroll button visibility
    useEffect(() => {
        const el = chatMessagesRef.current;
        if (!el) return;
        const handler = () =>
            setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
        el.addEventListener("scroll", handler, { passive: true });
        return () => el.removeEventListener("scroll", handler);
    }, [chatMessagesRef, messages.length]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey;
            if (mod && e.key === "b") {
                e.preventDefault();
                handleSidebarToggle();
            }
            if (mod && e.key === "k") {
                e.preventDefault();
                setShowCommandPalette((v) => !v);
            }
            if (mod && e.key === "n") {
                e.preventDefault();
                handleNewChat();
            }
            if (mod && e.key === "/") {
                e.preventDefault();
                setShowShortcuts((v) => !v);
            }
            if (mod && e.key === "Enter") {
                e.preventDefault();
                sendMessage();
            }
            if (e.key === "Escape") {
                if (showCommandPalette) setShowCommandPalette(false);
                else if (showShortcuts) setShowShortcuts(false);
                else if (window.innerWidth <= 768 && isSidebarOpen) setIsSidebarOpen(false);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [
        handleSidebarToggle,
        handleNewChat,
        sendMessage,
        showCommandPalette,
        showShortcuts,
        isSidebarOpen,
    ]);

    const handleFeedback = useCallback((msgId: string, type: "up" | "down") => {
        setFeedback((prev) => {
            const next = new Map(prev);
            if (next.get(msgId) === type) next.delete(msgId);
            else next.set(msgId, type);
            return next;
        });
    }, []);

    return {
        isSidebarOpen,
        setIsSidebarOpen,
        isMobile,
        isTouchDevice,
        showShortcuts,
        setShowShortcuts,
        showCommandPalette,
        setShowCommandPalette,
        showScrollBtn,
        hoveredMsgId,
        setHoveredMsgId,
        feedback,
        handleSidebarToggle,
        scrollToBottom,
        isNearBottom,
        handleFeedback,
    };
}
