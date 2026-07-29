"use client";

import { useEffect, useRef, ReactNode } from "react";

interface Props {
    children: ReactNode;
    isActive: boolean;
    onDeactivate: () => void;
}

export default function FocusTrap({ children, isActive, onDeactivate }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isActive) return;

        previousFocusRef.current = document.activeElement as HTMLElement;

        const container = containerRef.current;
        if (!container) return;

        const focusable = container.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        // Focus first element
        first?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onDeactivate();
                return;
            }
            if (e.key === "Tab") {
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last?.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first?.focus();
                    }
                }
            }
        };

        container.addEventListener("keydown", handleKeyDown);

        return () => {
            container.removeEventListener("keydown", handleKeyDown);
            previousFocusRef.current?.focus();
        };
    }, [isActive, onDeactivate]);

    if (!isActive) return null;

    return <div ref={containerRef}>{children}</div>;
}
