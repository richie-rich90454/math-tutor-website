import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef, RefObject } from "react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export { gsap, useGSAP };

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