// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ChatListItem from "@/components/sidebar/ChatListItem";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { ChatSession } from "@/contexts/ChatContext";

const chat: ChatSession = {
    id: "c1",
    title: "Fractions intro",
    preview: "What is 1/2 + 1/4?",
    timestamp: "2026-08-05T10:00:00Z",
    isPinned: false,
    messages: [],
};

function renderItem(overrides: Partial<ChatSession> = {}, props: Record<string, unknown> = {}) {
    return render(
        <LanguageProvider>
            <ChatListItem
                chat={{ ...chat, ...overrides }}
                onSelect={vi.fn()}
                onDelete={vi.fn()}
                onContextMenu={vi.fn()}
                isHovered={true}
                onHover={vi.fn()}
                isActive={false}
                isPinned={!!overrides.isPinned}
                {...props}
            />
        </LanguageProvider>,
    );
}

describe("ChatListItem", () => {
    it("renders the chat title and preview", () => {
        renderItem();
        expect(screen.getByText("Fractions intro")).toBeInTheDocument();
        expect(screen.getByText("What is 1/2 + 1/4?")).toBeInTheDocument();
    });

    it("shows a delete button that calls onDelete", () => {
        const onDelete = vi.fn();
        renderItem({}, { onDelete });
        fireEvent.click(screen.getByLabelText(/delete/i));
        expect(onDelete).toHaveBeenCalledWith("c1");
    });

    it("selects the chat on click", () => {
        const onSelect = vi.fn();
        renderItem({}, { onSelect });
        fireEvent.click(screen.getByText("Fractions intro"));
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "c1" }));
    });
});
