"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

interface SparklesProps {
    trigger: boolean;
    count?: number;
    colors?: string[];
    spread?: number;
    className?: string;
}

export default function Sparkles({
    trigger,
    count = 15,
    colors = ["#fbbf24", "#f59e0b", "#f472b6", "#a78bfa", "#34d399", "#60a5fa"],
    spread = 150,
    className,
}: SparklesProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const burst = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        for (let i = 0; i < count; i++) {
            const sparkle = document.createElement("div");
            sparkle.style.cssText = `
                position: absolute;
                left: ${cx}px;
                top: ${cy}px;
                width: ${4 + Math.random() * 6}px;
                height: ${4 + Math.random() * 6}px;
                border-radius: 50%;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                pointer-events: none;
                z-index: 100;
            `;
            container.appendChild(sparkle);

            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
            const distance = spread * (0.3 + Math.random() * 0.7);

            gsap.to(sparkle, {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance - 30,
                scale: 0,
                opacity: 0,
                duration: 0.7 + Math.random() * 0.5,
                ease: "power3.out",
                onComplete: () => sparkle.remove(),
            });
        }
    }, [count, colors, spread]);

    useEffect(() => {
        if (trigger) {
            burst();
        }
    }, [trigger, burst]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                overflow: "hidden",
            }}
            aria-hidden="true"
        />
    );
}
