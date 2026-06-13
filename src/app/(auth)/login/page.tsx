"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import PageTransition from "@/components/ui/PageTransition";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (isAuthenticated) {
            router.push("/");
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (cardRef.current) {
            const ctx = gsap.context(() => {
                gsap.from(cardRef.current, {
                    y: 40,
                    opacity: 0,
                    duration: 0.8,
                    ease: "elastic.out(1, 0.6)",
                });
                gsap.from(".auth-field", {
                    y: 20,
                    opacity: 0,
                    duration: 0.5,
                    stagger: 0.1,
                    delay: 0.3,
                    ease: "power2.out",
                });
            }, cardRef);
            return () => ctx.revert();
        }
    }, []);

    const shakeError = () => {
        if (cardRef.current) {
            gsap.fromTo(
                cardRef.current,
                { x: -10 },
                { x: 10, duration: 0.1, repeat: 3, yoyo: true, ease: "power2.inOut" }
            );
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await login(email, password);
            router.push("/");
        } catch (err: any) {
            setError(err.message || "Invalid email or password");
            shakeError();
        } finally {
            setIsLoading(false);
        }
    };

    if (isAuthenticated) return null;

    return (
        <PageTransition>
        <div className="auth-page">
            <div className="auth-card" ref={cardRef}>
                <div className="auth-card-header">
                    <Link href="/" className="auth-logo">
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            <line x1="8" y1="7" x2="16" y2="7" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                        <span>AI Math Tutor</span>
                    </Link>
                    <h1 className="auth-heading">Welcome back</h1>
                    <p className="auth-subtext">Sign in to continue your math journey</p>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label htmlFor="email" className="auth-label">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="auth-input"
                            required
                            autoComplete="email"
                            autoFocus
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password" className="auth-label">
                            Password
                        </label>
                        <div className="auth-password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="auth-input"
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="auth-password-toggle"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="auth-field">
                        <label className="auth-checkbox-label">
                            <input type="checkbox" className="auth-checkbox" />
                            <span>Remember me</span>
                        </label>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="auth-submit-btn"
                    >
                        {isLoading ? (
                            <span className="auth-spinner" />
                        ) : (
                            "Sign in"
                        )}
                    </button>
                </form>

                <p className="auth-footer-text">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="auth-link">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
        </PageTransition>
    );
}