import { useEffect, useRef } from 'preact/hooks';
import { gsap } from '../lib/gsap';
import { useLanguage } from '../contexts/LanguageContext';

interface ShortcutHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

const SHORTCUT_KEYS = [
    { keys: ["Ctrl", "B"], translationKey: "shortcutsToggleSidebar" as const },
    { keys: ["Ctrl", "N"], translationKey: "shortcutsNewChat" as const },
    { keys: ["Ctrl", "Enter"], translationKey: "shortcutsSendMessage" as const },
    { keys: ["Ctrl", "E"], translationKey: "shortcutsExportChat" as const },
    { keys: ["Esc"], translationKey: "shortcutsCloseModals" as const },
    { keys: ["Ctrl", "/"], translationKey: "shortcutsShowHelp" as const },
    { keys: ["Shift", "Enter"], translationKey: "shortcutsNewLine" as const },
];

export function ShortcutHelp({ isOpen, onClose }: ShortcutHelpProps) {
    const { t } = useLanguage();
    const backdropRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Tab" && modalRef.current) {
                const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
                );
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        window.addEventListener("keydown", handleKey);
        setTimeout(() => {
            const closeBtn = modalRef.current?.querySelector("button") as HTMLElement;
            closeBtn?.focus();
        }, 50);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && modalRef.current) {
            gsap.from(modalRef.current, {
                scale: 0.9,
                opacity: 0,
                duration: 0.3,
                ease: "back.out(1.7)",
            });
            gsap.from(backdropRef.current, { opacity: 0, duration: 0.2 });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div ref={backdropRef} class="shortcut-modal-backdrop" onClick={onClose}>
            <div ref={modalRef} class="shortcut-modal" onClick={(e) => e.stopPropagation()}>
                <div class="shortcut-modal-header">
                    <h2 class="shortcut-modal-title">{t("shortcutsTitle")}</h2>
                    <button
                        onClick={onClose}
                        class="shortcut-modal-close"
                        aria-label={t("a11yClose")}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div class="shortcut-section">
                    <h3 class="shortcut-section-title">{t("shortcutsGeneral")}</h3>
                    {SHORTCUT_KEYS.map((s) => (
                        <div key={s.translationKey} class="shortcut-row">
                            <span class="shortcut-label">{t(s.translationKey)}</span>
                            <span class="shortcut-keys">
                                {s.keys.map((k) => (
                                    <kbd key={k} class="shortcut-kbd">
                                        {k}
                                    </kbd>
                                ))}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
