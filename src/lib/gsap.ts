import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { RefObject } from "react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export { gsap, useGSAP, ScrollTrigger };

// ==========================================
// Entrance Animations
// ==========================================
export function fadeInUp(ref: RefObject<HTMLElement | null>, delay: number = 0) {
    if (!ref.current) return;
    return gsap.from(ref.current, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        delay,
        ease: "power2.out",
    });
}

export function fadeInScale(ref: RefObject<HTMLElement | null>, delay: number = 0) {
    if (!ref.current) return;
    return gsap.from(ref.current, {
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
        delay,
        ease: "back.out(1.7)",
    });
}

export function staggerChildren(
    parent: RefObject<HTMLElement | null>,
    childSelector: string,
    delay: number = 0
) {
    if (!parent.current) return;
    return gsap.from(parent.current.querySelectorAll(childSelector), {
        y: 20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.08,
        delay,
        ease: "power2.out",
    });
}

export function slideInLeft(ref: RefObject<HTMLElement | null>, delay: number = 0) {
    if (!ref.current) return;
    return gsap.from(ref.current, {
        x: -40,
        opacity: 0,
        duration: 0.5,
        delay,
        ease: "power2.out",
    });
}

export function slideInRight(ref: RefObject<HTMLElement | null>, delay: number = 0) {
    if (!ref.current) return;
    return gsap.from(ref.current, {
        x: 40,
        opacity: 0,
        duration: 0.5,
        delay,
        ease: "power2.out",
    });
}

// ==========================================
// Spring Physics Animations
// ==========================================

/**
 * Bouncy spring entrance — great for message bubbles
 */
export function springIn(el: HTMLElement, options?: {
    from?: "left" | "right" | "bottom";
    duration?: number;
    delay?: number;
}) {
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
 * Cinematic reveal — scale from center with fade
 */
export function cinematicReveal(el: HTMLElement, delay: number = 0) {
    return gsap.from(el, {
        scale: 0.85,
        opacity: 0,
        filter: "blur(10px)",
        duration: 0.8,
        delay,
        ease: "power3.out",
    });
}

/**
 * Typewriter effect for text elements
 */
export function typewriterText(el: HTMLElement, duration: number = 1) {
    const text = el.textContent || "";
    el.textContent = "";
    const chars = text.split("");
    
    chars.forEach((_, i) => {
        const span = document.createElement("span");
        span.textContent = text[i] === " " ? "\u00A0" : text[i];
        span.style.opacity = "0";
        el.appendChild(span);
    });

    const spans = el.querySelectorAll("span");
    return gsap.to(spans, {
        opacity: 1,
        duration: duration / chars.length,
        stagger: duration / chars.length,
        ease: "none",
    });
}

// ==========================================
// Micro-Interaction Utilities
// ==========================================

/**
 * Press-down bounce effect for buttons
 */
export function pressBounce(el: HTMLElement) {
    gsap.killTweensOf(el);
    return gsap.to(el, {
        scale: 0.92,
        duration: 0.1,
        ease: "power2.in",
        onComplete: () => {
            gsap.to(el, {
                scale: 1,
                duration: 0.4,
                ease: "elastic.out(1, 0.4)",
            });
        },
    });
}

/**
 * Gentle hover lift
 */
export function hoverLift(el: HTMLElement) {
    return gsap.to(el, {
        y: -4,
        scale: 1.02,
        duration: 0.25,
        ease: "power2.out",
    });
}

export function hoverUnlift(el: HTMLElement) {
    return gsap.to(el, {
        y: 0,
        scale: 1,
        duration: 0.25,
        ease: "power2.out",
    });
}

/**
 * Periodic attention pulse for CTAs
 */
export function attentionPulse(el: HTMLElement) {
    return gsap.to(el, {
        scale: 1.05,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
    });
}

/**
 * Celebratory scale burst
 */
export function successPop(el: HTMLElement) {
    return gsap.timeline()
        .to(el, { scale: 1.3, duration: 0.2, ease: "back.out(2)" })
        .to(el, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" });
}

/**
 * Horizontal shake for errors
 */
export function shakeError(el: HTMLElement) {
    return gsap.to(el, {
        x: [-8, 8, -6, 6, -3, 3, 0],
        duration: 0.5,
        ease: "power2.out",
    } as unknown as gsap.TweenVars);
}

/**
 * Magnetic hover — element follows cursor within bounds
 */
export function magneticHover(el: HTMLElement, strength: number = 0.3) {
    const bounds = el.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;

    const onMove = (e: MouseEvent) => {
        const dx = (e.clientX - centerX) * strength;
        const dy = (e.clientY - centerY) * strength;
        gsap.to(el, { x: dx, y: dy, duration: 0.4, ease: "power2.out" });
    };

    const onLeave = () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);

    return () => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
    };
}

// ==========================================
// Particle / Burst Effect
// ==========================================
/**
 * Create a burst of particles from an element's center
 */
export function particleBurst(
    el: HTMLElement,
    count: number = 8,
    colors: string[] = ["#60a5fa", "#a78bfa", "#f472b6", "#34d399"]
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

// ==========================================
// Scroll-Based Animations
// ==========================================
/**
 * Parallax effect where element moves slower than scroll
 */
export function parallaxScroll(
    el: HTMLElement,
    speed: number = 0.3,
    direction: "y" | "x" = "y"
) {
    return gsap.to(el, {
        [direction]: () => window.innerHeight * speed * (direction === "y" ? -1 : 1),
        ease: "none",
        scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
        },
    });
}

// ==========================================
// Hook: Animate on mount
// ==========================================
export function useAnimateOnMount(
    ref: RefObject<HTMLElement | null>,
    animation: gsap.TweenVars,
    deps: any[] = []
) {
    useGSAP(
        () => {
            if (ref.current) {
                gsap.from(ref.current, {
                    ...animation,
                });
            }
        },
        { dependencies: [ref, ...deps], scope: ref as RefObject<Element> }
    );
}