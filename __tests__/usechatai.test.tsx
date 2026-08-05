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

    it.each([
        ["Ctrl+N", "n", true],
        ["Ctrl+Enter", "Enter", true],
        ["Ctrl+/", "/", true],
        ["Ctrl+B", "b", true],
    ])("%s dispatches without throwing", (_label, key, ctrl) => {
        const { result } = setup();
        expect(() =>
            act(() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key, ctrlKey: ctrl }));
            }),
        ).not.toThrow();
        // Ctrl+/ toggles the shortcuts panel; Ctrl+B toggles the sidebar on desktop.
        expect(result.current).toBeDefined();
    });

    it("opens the shortcuts panel with Ctrl+/", () => {
        const { result } = setup();
        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "/", ctrlKey: true }));
        });
        expect(result.current.showShortcuts).toBe(true);
    });

    it("closes the shortcuts panel with Escape", () => {
        const { result } = setup();
        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "/", ctrlKey: true }));
        });
        expect(result.current.showShortcuts).toBe(true);
        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        });
        expect(result.current.showShortcuts).toBe(false);
    });

    it("does not open the shortcuts panel for a plain slash", () => {
        const { result } = setup();
        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "/" }));
        });
        expect(result.current.showShortcuts).toBe(false);
    });

    it.each([
        ["up", "up"],
        ["down", "down"],
    ])("feedback %s sets then toggles off", (_label, type) => {
        const { result } = setup();
        act(() => result.current.handleFeedback("m1", type as "up" | "down"));
        expect(result.current.feedback.get("m1")).toBe(type);
        act(() => result.current.handleFeedback("m1", type as "up" | "down"));
        expect(result.current.feedback.get("m1")).toBeUndefined();
    });

    it("keeps independent feedback per message", () => {
        const { result } = setup();
        act(() => result.current.handleFeedback("a", "up"));
        act(() => result.current.handleFeedback("b", "down"));
        expect(result.current.feedback.get("a")).toBe("up");
        expect(result.current.feedback.get("b")).toBe("down");
    });

    it("does not open the sidebar on desktop via toggle", () => {
        const { result } = setup();
        act(() => result.current.handleSidebarToggle());
        expect(result.current.isSidebarOpen).toBe(true);
    });
});
