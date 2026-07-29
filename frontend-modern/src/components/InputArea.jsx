import { useState, useRef, useCallback } from 'preact/hooks';

export function InputArea({ onSend, isLoading }) {
    const [text, setText] = useState('');
    const textareaRef = useRef(null);

    const handleInput = useCallback((e) => {
        setText(e.target.value);
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

    const handleKeyDown = useCallback((e) => {
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
