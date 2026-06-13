"use client";

import { useState, useRef, useEffect, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import PageTransition from "@/components/ui/PageTransition";
import { useAuth } from "@/contexts/AuthContext";

const STEPS = [
    { title: "Your details", fields: ["name", "email"] },
    { title: "Set password", fields: ["password", "confirmPassword"] },
    { title: "Math level", fields: ["mathLevel"] },
];

export default function SignupPage() {
    const router = useRouter();
    const { signup, isAuthenticated } = useAuth();
    const [step, setStep] = useState(0);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [mathLevel, setMathLevel] = useState("intermediate");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const stepRef = useRef<HTMLDivElement>(null);

    const passwordStrength = useMemo(() => {
        if (password.length === 0) return 0;
        if (password.length < 8) return 1;
        if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return 3;
        return 2;
    }, [password]);

    useEffect(() => {
        if (isAuthenticated) {
            router.push("/");
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (cardRef.current) {
            gsap.from(cardRef.current, {
                y: 40,
                opacity: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.6)",
            });
        }
    }, []);

    useEffect(() => {
        if (stepRef.current) {
            gsap.fromTo(
                stepRef.current,
                { x: 40, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
            );
        }
    }, [step]);

    const validateStep = (): boolean => {
        switch (step) {
            case 0:
                if (name.length < 2) {
                    setError("Name must be at least 2 characters");
                    return false;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    setError("Please enter a valid email");
                    return false;
                }
                break;
            case 1:
                if (password.length < 8) {
                    setError("Password must be at least 8 characters");
                    return false;
                }
                if (password !== confirmPassword) {
                    setError("Passwords do not match");
                    return false;
                }
                break;
        }
        setError("");
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setStep((s) => Math.min(s + 1, STEPS.length - 1));
        }
    };

    const prevStep = () => setStep((s) => Math.max(s - 1, 0));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (step < STEPS.length - 1) {
            nextStep();
            return;
        }

        setError("");
        setIsLoading(true);

        try {
            await signup(name, email, password, mathLevel);
            setSuccess(true);
            gsap.to(cardRef.current, {
                scale: 1.05,
                duration: 0.3,
                ease: "back.out",
                onComplete: () => {
                    gsap.to(cardRef.current, { scale: 1, duration: 0.3 });
                    setTimeout(() => router.push("/"), 1500);
                },
            });
        } catch (err: any) {
            setError(err.message || "Failed to create account");
            gsap.fromTo(cardRef.current, { x: -10 }, { x: 10, duration: 0.1, repeat: 3, yoyo: true });
        } finally {
            setIsLoading(false);
        }
    };

    const strengthLabel = ["", "Weak", "Fair", "Strong"];
    const strengthColor = ["", "var(--color-red-600)", "#f59e0b", "#10b981"];

    if (isAuthenticated) return null;

    return (
        <PageTransition>
        <div className="auth-page">
            <div className="auth-card" ref={cardRef}>
                <div className="auth-card-header">
                    <Link href="/" className="auth-logo">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            <line x1="8" y1="7" x2="16" y2="7" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                        <span>AI Math Tutor</span>
                    </Link>
                    <h1 className="auth-heading">Create your account</h1>

                    <div className="auth-steps">
                        {STEPS.map((s, i) => (
                            <div
                                key={i}
                                className={`auth-step-dot ${i <= step ? "is-active" : ""} ${i < step ? "is-done" : ""}`}
                            />
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div ref={stepRef} className="auth-step-content">
                        {step === 0 && (
                            <>
                                <div className="auth-field">
                                    <label htmlFor="name" className="auth-label">Name</label>
                                    <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="auth-input" required autoFocus />
                                </div>
                                <div className="auth-field">
                                    <label htmlFor="email" className="auth-label">Email</label>
                                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="auth-input" required autoComplete="email" />
                                </div>
                            </>
                        )}

                        {step === 1 && (
                            <>
                                <div className="auth-field">
                                    <label htmlFor="password" className="auth-label">Password</label>
                                    <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="auth-input" required autoFocus />
                                    {password.length > 0 && (
                                        <div className="auth-strength">
                                            <div className="auth-strength-bar">
                                                <div
                                                    className="auth-strength-fill"
                                                    style={{ width: `${(passwordStrength / 3) * 100}%`, backgroundColor: strengthColor[passwordStrength] }}
                                                />
                                            </div>
                                            <span className="auth-strength-label" style={{ color: strengthColor[passwordStrength] }}>
                                                {strengthLabel[passwordStrength]}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="auth-field">
                                    <label htmlFor="confirmPassword" className="auth-label">Confirm password</label>
                                    <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" className="auth-input" required />
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <div className="auth-field">
                                <label className="auth-label">Your math level</label>
                                <div className="auth-radio-group">
                                    {[
                                        { value: "beginner", label: "Beginner", desc: "Just getting started with math" },
                                        { value: "intermediate", label: "Intermediate", desc: "Comfortable with basics, learning more" },
                                        { value: "advanced", label: "Advanced", desc: "Ready for complex problems" },
                                    ].map((level) => (
                                        <label
                                            key={level.value}
                                            className={`auth-radio-card ${mathLevel === level.value ? "is-selected" : ""}`}
                                        >
                                            <input
                                                type="radio"
                                                name="mathLevel"
                                                value={level.value}
                                                checked={mathLevel === level.value}
                                                onChange={(e) => setMathLevel(e.target.value)}
                                                className="auth-radio-input"
                                            />
                                            <span className="auth-radio-label">{level.label}</span>
                                            <span className="auth-radio-desc">{level.desc}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="auth-error">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="auth-form-actions">
                        {step > 0 && (
                            <button type="button" onClick={prevStep} className="auth-back-btn">
                                Back
                            </button>
                        )}
                        <button type="submit" disabled={isLoading} className="auth-submit-btn auth-submit-full">
                            {isLoading ? (
                                <span className="auth-spinner" />
                            ) : step === STEPS.length - 1 ? (
                                success ? "✓ Account created!" : "Create account"
                            ) : (
                                "Continue"
                            )}
                        </button>
                    </div>
                </form>

                <p className="auth-footer-text">
                    Already have an account?{" "}
                    <Link href="/login" className="auth-link">Sign in</Link>
                </p>
            </div>
        </div>
        </PageTransition>
    );
}