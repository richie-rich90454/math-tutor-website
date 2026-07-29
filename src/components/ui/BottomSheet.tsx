"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const startYRef = useRef(0);
    const currentYRef = useRef(0);

    // Open/close animation
    useEffect(() => {
        const sheet = sheetRef.current;
        const backdrop = backdropRef.current;
        if (!sheet || !backdrop) return;

        if (isOpen) {
            gsap.set(sheet, { y: "100%" });
            gsap.set(backdrop, { opacity: 0, display: "flex" });
            gsap.to(backdrop, { opacity: 1, duration: 0.25, ease: "power2.out" });
            gsap.to(sheet, {
                y: 0,
                duration: 0.4,
                ease: "power3.out",
            });
        } else {
            gsap.to(sheet, {
                y: "100%",
                duration: 0.3,
                ease: "power3.in",
            });
            gsap.to(backdrop, {
                opacity: 0,
                duration: 0.25,
                ease: "power2.in",
                onComplete: () => gsap.set(backdrop, { display: "none" }),
            });
        }
    }, [isOpen]);

    // Swipe to dismiss
    useEffect(() => {
        const sheet = sheetRef.current;
        if (!sheet) return;

        const onTouchStart = (e: TouchEvent) => {
            startYRef.current = e.touches[0].clientY;
        };

        const onTouchMove = (e: TouchEvent) => {
            currentYRef.current = e.touches[0].clientY;
            const delta = currentYRef.current - startYRef.current;
            if (delta > 0) {
                gsap.set(sheet, { y: delta });
            }
        };

        const onTouchEnd = () => {
            const delta = currentYRef.current - startYRef.current;
            if (delta > 100) {
                onClose();
            } else {
                gsap.to(sheet, { y: 0, duration: 0.3, ease: "power3.out" });
            }
        };

        sheet.addEventListener("touchstart", onTouchStart, { passive: true });
        sheet.addEventListener("touchmove", onTouchMove, { passive: true });
        sheet.addEventListener("touchend", onTouchEnd);

        return () => {
            sheet.removeEventListener("touchstart", onTouchStart);
            sheet.removeEventListener("touchmove", onTouchMove);
            sheet.removeEventListener("touchend", onTouchEnd);
        };
    }, [onClose]);

    const handleBackdropClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === backdropRef.current) onClose();
        },
        [onClose],
    );

    return (
        <div
            ref={backdropRef}
            className="bottom-sheet-backdrop"
            onClick={handleBackdropClick}
            style={{ display: "none" }}
        >
            <div ref={sheetRef} className="bottom-sheet">
                {/* Drag handle */}
                <div className="bottom-sheet-handle-bar">
                    <div className="bottom-sheet-handle" />
                </div>

                {title && <h3 className="bottom-sheet-title">{title}</h3>}

                <div className="bottom-sheet-content">{children}</div>
            </div>
        </div>
    );
}
