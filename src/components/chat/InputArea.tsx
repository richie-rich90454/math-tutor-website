"use client";

import { memo, useRef, useEffect, useCallback, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface InputAreaProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    isLoading: boolean;
    placeholder?: string;
    onStop?: () => void;
    isStreaming?: boolean;
    onImageSelect?: (imageData: string, mimeType: string) => void;
    pendingImage?: { data: string; mimeType: string } | null;
    onClearImage?: () => void;
}

const InputArea = memo(function InputArea({
    value,
    onChange,
    onSend,
    isLoading,
    placeholder = "Ask a math question...",
    onStop,
    isStreaming = false,
    onImageSelect,
    pendingImage,
    onClearImage,
}: InputAreaProps) {
    const { t } = useLanguage();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
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
        if ((!value.trim() && !pendingImage) || isLoading) return;
        onSend();
    }, [value, isLoading, onSend, pendingImage]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // File handling
    const processFile = useCallback(
        (file: File) => {
            if (!file.type.startsWith("image/") || !onImageSelect) return;
            if (file.size > 20 * 1024 * 1024) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                onImageSelect(e.target?.result as string, file.type);
            };
            reader.readAsDataURL(file);
        },
        [onImageSelect]
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
            e.target.value = "";
        },
        [processFile]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) processFile(file);
        },
        [processFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    // Voice input
    const toggleVoice = useCallback(() => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        // Map language codes to speech recognition lang
        const langMap: Record<string, string> = {
            en: "en-US",
            "zh-hans": "zh-CN",
            "zh-hant": "zh-TW",
            "mn-cyrl": "mn-MN",
            "mn-mong": "mn-MN",
            bo: "bo-CN",
            es: "es-ES",
            fr: "fr-FR",
            de: "de-DE",
            ja: "ja-JP",
        };
        // Use current language from document or default to en-US
        const currentLang = document.documentElement.lang || "en";
        recognition.lang = langMap[currentLang] || "en-US";

        recognition.onresult = (event: any) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            if (event.results[event.results.length - 1].isFinal) {
                onChange(value ? value + " " + transcript : transcript);
                setIsListening(false);
            }
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    }, [isListening, value, onChange]);

    return (
        <div className="ia-root">
            {onImageSelect && (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-hidden="true"
                />
            )}

            {/* Image preview inside the card */}
            {pendingImage && (
                <div className="ia-image-preview">
                    <img src={pendingImage.data} alt="Selected" className="ia-image-preview-img" />
                    <button className="ia-image-preview-remove" onClick={onClearImage} aria-label="Remove image">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="ia-textarea-wrap"
                onDrop={onImageSelect ? handleDrop : undefined}
                onDragOver={onImageSelect ? handleDragOver : undefined}
                onDragLeave={onImageSelect ? handleDragLeave : undefined}
            >
                {/* Left-side utility buttons */}
                {onImageSelect && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="ia-util-btn"
                        title={t("inputAttachImage") || "Attach image"}
                        aria-label={t("inputAttachImage") || "Attach image"}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </button>
                )}

                <button
                    onClick={toggleVoice}
                    disabled={isLoading}
                    className={`ia-util-btn ${isListening ? "is-active" : ""}`}
                    title={isListening ? (t("inputStopListening") || "Stop") : (t("inputVoiceInput") || "Voice")}
                    aria-label={isListening ? (t("inputStopListening") || "Stop") : (t("inputVoiceInput") || "Voice")}
                >
                    {isListening ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    )}
                </button>

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

                {/* Right-side action button */}
                {isStreaming ? (
                    <button
                        onClick={onStop}
                        className="ia-action-btn ia-stop-btn"
                        title={t("inputStopGenerating")}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="4" y="4" width="16" height="16" rx="2" />
                        </svg>
                    </button>
                ) : (
                    <button
                        onClick={handleSend}
                        disabled={(!value.trim() && !pendingImage) || isLoading}
                        className="ia-action-btn ia-send-btn"
                        aria-label={t("inputSendMessage")}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                )}

                {/* Drag overlay */}
                {isDragOver && (
                    <div className="ia-drag-overlay">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span>{t("inputDropImage") || "Drop image here"}</span>
                    </div>
                )}
            </div>

            <div className="ia-bottom">
                <span className="ia-hint">{t("inputShiftHint")}</span>
                {charCount > 1000 && (
                    <span className="ia-char-count">{charCount}</span>
                )}
            </div>
        </div>
    );
});

export { InputArea };
export default InputArea;
