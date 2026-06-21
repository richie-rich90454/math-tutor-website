"use client";

import { useCallback } from "react";

export function useRipple() {
    const createRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement("span");
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            border-radius: 50%;
            background: currentColor;
            opacity: 0.12;
            pointer-events: none;
            transform: scale(0);
            animation: rippleEffect 0.6s ease-out forwards;
        `;
        target.style.position = "relative";
        target.style.overflow = "hidden";
        target.appendChild(ripple);

        ripple.addEventListener("animationend", () => ripple.remove());
    }, []);

    return createRipple;
}