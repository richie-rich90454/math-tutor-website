"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useLanguage } from "@/contexts/LanguageContext";

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

export default function ShortcutHelp({ isOpen, onClose }: ShortcutHelpProps) {
    const { t } = useLanguage();
    const backdropRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            // Focus trap: cycle Tab within modal
            if (e.key === "Tab" && modalRef.current) {
                const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
        // Focus the close button on open
        setTimeout(() => {
            const closeBtn = modalRef.current?.querySelector("button") as HTMLElement;
            closeBtn?.focus();
        }, 50);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && modalRef.current) {
            gsap.from(modalRef.current, { scale: 0.9, opacity: 0, duration: 0.3, ease: "back.out(1.7)" });
            gsap.from(backdropRef.current, { opacity: 0, duration: 0.2 });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div ref={backdropRef} className="shortcut-modal-backdrop" onClick={onClose}>
            <div ref={modalRef} className="shortcut-modal" onClick={(e) => e.stopPropagation()}>
                <div className="shortcut-modal-header">
                    <h2 className="shortcut-modal-title">{t("shortcutsTitle")}</h2>
                    <button onClick={onClose} className="shortcut-modal-close" aria-label={t("a11yClose")}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
                <div className="shortcut-section">
                    <h3 className="shortcut-section-title">{t("shortcutsGeneral")}</h3>
                    {SHORTCUT_KEYS.map((s) => (
                        <div key={s.translationKey} className="shortcut-row">
                            <span className="shortcut-label">{t(s.translationKey)}</span>
                            <span className="shortcut-keys">
                                {s.keys.map((k) => (
                                    <kbd key={k} className="shortcut-kbd">{k}</kbd>
                                ))}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}