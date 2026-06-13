"use client";

import { memo, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface InputAreaProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    isLoading: boolean;
    placeholder?: string;
    onStop?: () => void;
    isStreaming?: boolean;
}

const InputArea = memo(function InputArea({
    value,
    onChange,
    onSend,
    isLoading,
    placeholder = "Ask a math question...",
    onStop,
    isStreaming = false,
}: InputAreaProps) {
    const { t } = useLanguage();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const charCount = value.length;

    const adjustHeight = useCallback(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        const newHeight = Math.min(ta.scrollHeight, 144);
        ta.style.height = `${newHeight}px`;
        ta.style.overflowY = ta.scrollHeight > 144 ? "auto" : "hidden";
    }, []);

    useEffect(() => {
        adjustHeight();
    }, [value, adjustHeight]);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange(e.target.value);
            setTimeout(adjustHeight, 0);
        },
        [onChange, adjustHeight]
    );

    const handleSend = useCallback(() => {
        if (!value.trim() || isLoading) return;
        onSend();
    }, [value, isLoading, onSend]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="ia-root">
            <div className="ia-row">
                <div className="ia-textarea-wrap">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="ia-textarea"
                        rows={1}
                        disabled={isLoading}
                    />
                    {isStreaming ? (
                        <button
                            onClick={onStop}
                            className="ia-stop-btn"
                            title={t("inputStopGenerating")}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="4" y="4" width="16" height="16" rx="2" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={handleSend}
                            disabled={!value.trim() || isLoading}
                            className="ia-send-btn"
                            aria-label={t("inputSendMessage")}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            <div className="ia-bottom">
                <span className="ia-hint">{t("inputShiftHint")}</span>
                {charCount > 1000 && (
                    <span className="ia-char-count">{charCount}</span>
                )}
            </div>
        </div>
    );
}

export default InputArea;