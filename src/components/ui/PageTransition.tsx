"use client";

import { useRef, ReactNode } from "react";
import { useGSAP } from "@/lib/gsap";
import gsap from "gsap";

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

export default function PageTransition({ children, className = "" }: PageTransitionProps) {
    const ref = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            gsap.from(ref.current, {
                y: 20,
                opacity: 0,
                duration: 0.5,
                ease: "power3.out",
            });
        },
        { scope: ref }
    );

    return (
        <div ref={ref} className={className}>
            {children}
        </div>
    );
}