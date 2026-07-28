import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export { gsap, useGSAP, ScrollTrigger };

// ponytail: removed 25 unused helpers (fadeInUp, staggerChildren, pressBounce,
// hoverLift, magneticHover, parallaxScroll, etc.). Add back only when needed.

/**
 * Bouncy spring entrance — great for message bubbles
 */
export function springIn(
    el: HTMLElement,
    options?: {
        from?: "left" | "right" | "bottom";
        duration?: number;
        delay?: number;
    },
) {
    const from = options?.from || "bottom";
    const props: gsap.TweenVars = {
        opacity: 0,
        duration: options?.duration || 0.6,
        delay: options?.delay || 0,
        ease: "elastic.out(1, 0.5)",
    };
    if (from === "right") props.x = 40;
    else if (from === "left") props.x = -40;
    else props.y = 20;
    return gsap.from(el, props);
}

/**
 * Create a burst of particles from an element's center
 */
export function particleBurst(
    el: HTMLElement,
    count: number = 8,
    colors: string[] = ["#60a5fa", "#a78bfa", "#f472b6", "#34d399"],
) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement("div");
        particle.style.cssText = `
            position: fixed;
            left: ${cx}px;
            top: ${cy}px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: ${colors[i % colors.length]};
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(particle);

        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const distance = 30 + Math.random() * 40;

        gsap.to(particle, {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            scale: 0,
            opacity: 0,
            duration: 0.6 + Math.random() * 0.3,
            ease: "power2.out",
            onComplete: () => particle.remove(),
        });
    }
}
