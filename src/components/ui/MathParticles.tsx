"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

const SYMBOLS = ["+", "−", "×", "÷", "=", "π", "√", "∑", "∫", "∞", "α", "β", "θ", "Δ", "λ", "∂", "∇", "∈", "∉", "∝"];
const FORMULAS = ["E=mc²", "a²+b²=c²", "e^(iπ)=-1", "∫f(x)dx", "Δ=b²-4ac", "x=(-b±√Δ)/2a", "sin²θ+cos²θ=1"];

interface Particle {
    el: HTMLSpanElement;
}

export default function MathParticles() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const particles: Particle[] = [];
        const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";

        // Create 30 particles — mix of symbols and formulas
        for (let i = 0; i < 30; i++) {
            const el = document.createElement("span");
            el.className = "math-particle";
            
            // Every 5th particle is a formula
            const isFormula = i % 5 === 0;
            if (isFormula) {
                el.textContent = FORMULAS[Math.floor(Math.random() * FORMULAS.length)];
                el.style.fontSize = `${0.9 + Math.random() * 0.6}rem`;
            } else {
                el.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
                el.style.fontSize = `${1.2 + Math.random() * 2.5}rem`;
            }

            const opacity = isDark ? 0.04 + Math.random() * 0.08 : 0.03 + Math.random() * 0.07;
            el.style.opacity = String(opacity);
            
            // Subtle glow in dark mode
            if (isDark) {
                el.style.textShadow = `0 0 ${6 + Math.random() * 8}px rgba(148, 163, 184, 0.15)`;
            }

            el.style.left = `${Math.random() * 100}%`;
            el.style.top = `${Math.random() * 100}%`;

            container.appendChild(el);
            particles.push({ el });
        }

        if (isReducedMotion) {
            return () => particles.forEach((p) => p.el.remove());
        }

        // Animate each particle with unique parameters
        particles.forEach((p, i) => {
            const duration = 16 + Math.random() * 30;
            const delay = Math.random() * 12;

            // Sine-wave drift
            gsap.to(p.el, {
                x: () => (Math.random() - 0.5) * 120,
                y: () => (Math.random() - 0.5) * 140 - 50,
                opacity: () => 0.02 + Math.random() * 0.08,
                duration,
                delay,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });

            // Gentle rotation with varied speeds
            gsap.to(p.el, {
                rotation: () => (Math.random() - 0.5) * 80,
                duration: duration * 1.3,
                delay: delay + 1,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });

            // Scale breathing for formulas
            if (i % 5 === 0) {
                gsap.to(p.el, {
                    scale: 1.15,
                    duration: duration * 0.7,
                    delay,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                });
            }
        });

        return () => {
            particles.forEach((p) => {
                gsap.killTweensOf(p.el);
                p.el.remove();
            });
        };
    }, []);

    return <div ref={containerRef} className="math-particles-container" aria-hidden="true" />;
}