"use client";

import { useRef, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";

interface Props {
    children: ReactNode;
}

export default function PageTransition({ children }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useGSAP(() => {
        if (!containerRef.current) return;
        
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) {
            gsap.set(containerRef.current, { opacity: 1, y: 0 });
            return;
        }

        gsap.fromTo(
            containerRef.current,
            { opacity: 0, y: 12, filter: "blur(4px)" },
            { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.4, ease: "power2.out" }
        );
    }, { dependencies: [pathname], scope: containerRef });

    return <div ref={containerRef}>{children}</div>;
}