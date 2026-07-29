import { useState, useRef, useCallback } from 'preact/hooks';
import type { InputAreaProps } from '../types/props';

export function InputArea({ onSend, isLoading }: InputAreaProps) {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleInput = useCallback((e: Event) => {
        const target = e.target as HTMLTextAreaElement;
        setText(target.value);
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 144) + 'px';
        }
    }, []);

    const handleSubmit = useCallback(() => {
        if (!text.trim() || isLoading) return;
        onSend(text);
        setText('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, [text, isLoading, onSend]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }, [handleSubmit]);

    return (
        <div class="input-card">
            <textarea
                ref={textareaRef}
                class="ia-textarea"
                placeholder="Ask a math question..."
                value={text}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                rows={1}
            />
            <button
                class="ia-send-btn"
                onClick={handleSubmit}
                disabled={!text.trim() || isLoading}
                aria-label="Send message"
            >
                {isLoading ? '...' : '>'}
            </button>
        </div>
    );
}
