"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

interface AnimatedCounterProps {
    from?: number;
    to: number;
    duration?: number;
    delay?: number;
    className?: string;
    suffix?: string;
}

export default function AnimatedCounter({
    from = 0,
    to,
    duration = 1.5,
    delay = 0,
    className = "",
    suffix = "",
}: AnimatedCounterProps) {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        const obj = { value: from };

        gsap.to(obj, {
            value: to,
            duration,
            delay,
            ease: "power2.out",
            onUpdate: () => {
                if (ref.current) {
                    ref.current.textContent = Math.round(obj.value) + suffix;
                }
            },
        });
    }, [from, to, duration, delay, suffix]);

    return <span ref={ref} className={className}>{from}{suffix}</span>;
}