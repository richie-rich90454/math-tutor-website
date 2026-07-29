import { useRef, useCallback } from 'preact/hooks';

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

export function InputArea({ value, onChange, onSend, isLoading, placeholder, onStop, isStreaming, _onImageSelect, pendingImage, onClearImage }: InputAreaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleInput = useCallback((e: Event) => {
        const target = e.target as HTMLTextAreaElement;
        onChange(target.value);
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 144) + 'px';
        }
    }, [onChange]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (isStreaming && onStop) {
                onStop();
            } else {
                onSend();
            }
        }
    }, [onSend, isStreaming, onStop]);

    const handleSendClick = useCallback(() => {
        if (isStreaming && onStop) {
            onStop();
        } else {
            onSend();
        }
    }, [onSend, isStreaming, onStop]);

    const isDisabled = isLoading || isStreaming || !value.trim();

    return (
        <div class="input-card">
            {pendingImage && (
                <div class="ia-image-preview">
                    <img src={pendingImage.data} alt="Preview" class="ia-image-thumb" />
                    <button class="ia-image-remove" onClick={onClearImage} aria-label="Remove image">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
            )}
            <div class="ia-input-row">
                <textarea
                    ref={textareaRef}
                    class="ia-textarea"
                    placeholder={placeholder || 'Ask a math question...'}
                    value={value}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    rows={1}
                />
                <button
                    class={`ia-send-btn ${isDisabled ? 'ia-send-btn-disabled' : ''}`}
                    onClick={handleSendClick}
                    disabled={!isStreaming && (!value.trim() || isLoading)}
                    aria-label={isStreaming ? 'Stop' : 'Send'}
                >
                    {isStreaming ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    )}
                </button>
            </div>
        </div>
    );
}
