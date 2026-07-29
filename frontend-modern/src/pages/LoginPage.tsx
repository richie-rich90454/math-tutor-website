import { useState, useRef, useEffect } from "preact/hooks";
import { FormEvent } from "preact/compat";
import { useLocation, Link } from "wouter";
import gsap from "gsap";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

export function LoginPage() {
    const [, setLocation] = useLocation();
    const { t } = useLanguage();
    const { login, isAuthenticated } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (isAuthenticated) {
            setLocation("/");
        }
    }, [isAuthenticated, setLocation]);

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
                { x: 10, duration: 0.1, repeat: 3, yoyo: true, ease: "power2.inOut" },
            );
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await login(email, password, remember);
            setLocation("/");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : t("authInvalidCredentials");
            setError(msg);
            shakeError();
        } finally {
            setIsLoading(false);
        }
    };

    if (isAuthenticated) return null;

    return (
        <PageTransition>
            <div class="auth-page">
                <div class="auth-card" ref={cardRef}>
                    <div class="auth-card-header">
                        <Link href="/" className="auth-logo">
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                <line x1="8" y1="7" x2="16" y2="7" />
                                <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                            <span>{t("ciAIMathTutor")}</span>
                        </Link>
                        <h1 class="auth-heading">{t("authLoginTitle")}</h1>
                        <p class="auth-subtext">{t("authLoginSubtitle")}</p>
                    </div>

                    <form ref={formRef} onSubmit={handleSubmit} class="auth-form">
                        <div class="auth-field">
                            <label for="email" class="auth-label">
                                {t("authEmail")}
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                                placeholder={t("authEmailPlaceholder")}
                                class="auth-input"
                                required
                                autoComplete="email"
                                autoFocus
                            />
                        </div>

                        <div class="auth-field">
                            <label for="password" class="auth-label">
                                {t("authPassword")}
                            </label>
                            <div class="auth-password-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                                    placeholder={t("authPasswordPlaceholder")}
                                    class="auth-input"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    class="auth-password-toggle"
                                    aria-label={
                                        showPassword ? t("authHidePassword") : t("authShowPassword")
                                    }
                                >
                                    {showPassword ? (
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        >
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        >
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div class="auth-field">
                            <label class="auth-checkbox-label">
                                <input
                                    type="checkbox"
                                    class="auth-checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember((e.target as HTMLInputElement).checked)}
                                />
                                <span>{t("authRememberMe")}</span>
                            </label>
                        </div>

                        {error && (
                            <div class="auth-error">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <button type="submit" disabled={isLoading} class="auth-submit-btn">
                            {isLoading ? <span class="auth-spinner" /> : t("authSignIn")}
                        </button>
                    </form>

                    <p class="auth-footer-text">
                        {t("authNoAccount")}{" "}
                        <Link href="/signup" className="auth-link">
                            {t("authCreateOne")}
                        </Link>
                    </p>
                </div>
            </div>
        </PageTransition>
    );
}
