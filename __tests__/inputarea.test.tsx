// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import InputArea from "@/components/chat/InputArea";
import { LanguageProvider } from "@/contexts/LanguageContext";

function renderInput(props: Record<string, unknown> = {}) {
    const onChange = props.onChange || vi.fn();
    const onSend = props.onSend || vi.fn();
    const utils = render(
        <LanguageProvider>
            <InputArea
                value={String(props.value ?? "")}
                onChange={onChange}
                onSend={onSend}
                isLoading={!!props.isLoading}
                onStop={props.onStop || vi.fn()}
                isStreaming={!!props.isStreaming}
                {...props}
            />
        </LanguageProvider>,
    );
    return { ...utils, onChange, onSend };
}

describe("InputArea", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("does not send when the input is empty", () => {
        const { onSend } = renderInput();
        fireEvent.click(screen.getByRole("button", { name: /send message/i }));
        expect(onSend).not.toHaveBeenCalled();
    });

    it("sends typed text via the send button", () => {
        const { onChange, onSend } = renderInput({ value: "2+2" });
        fireEvent.click(screen.getByRole("button", { name: /send message/i }));
        expect(onSend).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
    });

    it("sends on Enter and inserts a newline on Shift+Enter", () => {
        const { onSend } = renderInput({ value: "hello" });
        const textarea = screen.getByRole("textbox");
        fireEvent.keyDown(textarea, { key: "Enter" });
        expect(onSend).toHaveBeenCalledTimes(1);
        fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
        expect(onSend).toHaveBeenCalledTimes(1);
    });

    it("shows the stop button while streaming", () => {
        const onStop = vi.fn();
        renderInput({ value: "x", isStreaming: true, onStop });
        fireEvent.click(screen.getByRole("button", { name: /stop generating/i }));
        expect(onStop).toHaveBeenCalledTimes(1);
    });

    // Sending is gated on non-empty input across several payload shapes.
    it.each([
        ["plain text", "solve 2x=4"],
        ["whitespace-trimmed", "  hello  "],
        ["unicode math", "∫x dx"],
        ["long query", "a".repeat(200)],
        ["slash command", "/check 2+2"],
    ])("sends %s via the send button", (_label, text) => {
        const { onSend } = renderInput({ value: text });
        fireEvent.click(screen.getByRole("button", { name: /send message/i }));
        expect(onSend).toHaveBeenCalledTimes(1);
    });

    it.each([
        ["empty", ""],
        ["only spaces", "   "],
        ["tab", "\t"],
        ["newline", "\n"],
    ])("does not send %s input", (_label, text) => {
        const { onSend } = renderInput({ value: text });
        fireEvent.click(screen.getByRole("button", { name: /send message/i }));
        expect(onSend).not.toHaveBeenCalled();
    });

    it.each([
        ["enter", { key: "Enter" }],
        ["enter with meta", { key: "Enter", metaKey: true }],
        ["alt+enter", { key: "Enter", altKey: true }],
    ])("Enter (%s) sends", (_label, opts) => {
        const { onSend } = renderInput({ value: "1+1" });
        fireEvent.keyDown(screen.getByRole("textbox"), opts);
        expect(onSend).toHaveBeenCalledTimes(1);
    });

    it("shift+enter does not send", () => {
        const { onSend } = renderInput({ value: "1+1" });
        fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", shiftKey: true });
        expect(onSend).not.toHaveBeenCalled();
    });

    it("does not send while loading", () => {
        const { onSend } = renderInput({ value: "text", isLoading: true });
        fireEvent.click(screen.getByRole("button", { name: /send message/i }));
        expect(onSend).not.toHaveBeenCalled();
    });

    it("ignores non-image file selections", () => {
        const onImageSelect = vi.fn();
        const { container } = renderInput({ onImageSelect });
        const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(["x"], "notes.txt", { type: "text/plain" });
        fireEvent.change(fileInput, { target: { files: [file] } });
        expect(onImageSelect).not.toHaveBeenCalled();
    });

    it("accepts image file selections under the size cap", async () => {
        const onImageSelect = vi.fn();
        const { container } = renderInput({ onImageSelect });
        const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(["img"], "photo.png", { type: "image/png" });
        fireEvent.change(fileInput, { target: { files: [file] } });
        await waitFor(() => expect(onImageSelect).toHaveBeenCalledTimes(1));
        expect(onImageSelect.mock.calls[0][1]).toBe("image/png");
    });

    it("rejects image files above the 3MB backend cap", () => {
        const onImageSelect = vi.fn();
        const { container } = renderInput({ onImageSelect });
        const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
        const big = new File([new ArrayBuffer(4 * 1024 * 1024)], "big.png", {
            type: "image/png",
        });
        fireEvent.change(fileInput, { target: { files: [big] } });
        expect(onImageSelect).not.toHaveBeenCalled();
    });
});
