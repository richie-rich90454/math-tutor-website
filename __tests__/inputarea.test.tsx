// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
});
