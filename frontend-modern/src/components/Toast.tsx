import { useEffect, useRef } from 'preact/hooks';
import type { VNode } from 'preact';
import gsap from 'gsap';
import { useToast, type ToastType } from '../contexts/ToastContext';
import type { Toast } from '../contexts/ToastContext';

const icons: Record<ToastType, VNode> = {
    success: (
        <>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </>
    ),
    error: (
        <>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </>
    ),
    warning: (
        <>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </>
    ),
    info: (
        <>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </>
    ),
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        gsap.fromTo(el, { opacity: 0, y: -12, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' });
    }, []);

    const handleClose = () => {
        const el = ref.current;
        if (!el) return onRemove(toast.id);
        gsap.to(el, {
            opacity: 0, y: -12, scale: 0.95, duration: 0.25, ease: 'power2.in',
            onComplete: () => onRemove(toast.id),
        });
    };

    return (
        <div ref={ref} class={`toast-item is-${toast.type}`}>
            <svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                {icons[toast.type]}
            </svg>
            <span class="toast-message">{toast.message}</span>
            <button class="toast-close" onClick={handleClose} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
            <div class="toast-progress" />
        </div>
    );
}

export function Toast() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div class="toast-container">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onRemove={removeToast} />
            ))}
        </div>
    );
}
