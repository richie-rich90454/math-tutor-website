// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChatUI } from "@/hooks/useChatUI";

function setup() {
    const sendMessage = vi.fn();
    const handleNewChat = vi.fn();
    const chatMessagesRef = { current: null };
    const messagesEndRef = { current: null };
    const prevMessagesLenRef = { current: 0 };
    if (!window.matchMedia) {
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: vi.fn().mockReturnValue({
                matches: false,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            }),
        });
    }
    const { result } = renderHook(() =>
        useChatUI(
            sendMessage,
            handleNewChat,
            chatMessagesRef,
            messagesEndRef,
            false,
            [],
            prevMessagesLenRef,
        ),
    );
    return { result, sendMessage, handleNewChat };
}

describe("useChatUI", () => {
    beforeEach(() => {
        window.innerWidth = 1280;
    });

    it("opens the sidebar by default on desktop", () => {
        const { result } = setup();
        expect(result.current.isSidebarOpen).toBe(true);
    });

    it("toggles feedback: set, then toggle off", () => {
        const { result } = setup();
        act(() => result.current.handleFeedback("m1", "up"));
        expect(result.current.feedback.get("m1")).toBe("up");
        act(() => result.current.handleFeedback("m1", "up"));
        expect(result.current.feedback.get("m1")).toBeUndefined();
        act(() => result.current.handleFeedback("m1", "down"));
        expect(result.current.feedback.get("m1")).toBe("down");
    });

    it("opens the command palette with Ctrl+K", () => {
        const { result } = setup();
        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        });
        expect(result.current.showCommandPalette).toBe(true);
    });

    it("closes the command palette with Escape", () => {
        const { result } = setup();
        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        });
        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        });
        expect(result.current.showCommandPalette).toBe(false);
    });

    it("creates a new chat with Ctrl+N", () => {
        const { result, handleNewChat } = setup();
        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "n", ctrlKey: true }));
        });
        expect(handleNewChat).toHaveBeenCalledTimes(1);
        expect(result.current.showCommandPalette).toBe(false);
    });
});
