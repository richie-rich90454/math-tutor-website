"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiFetch } from "@/lib/api-client";

interface Problem {
    id: string;
    topic: string;
    grade: number;
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
    language: string;
}

interface ReviewItem extends Problem {
    nextReview?: string;
    intervalDays?: number;
}

const TOPICS = ["arithmetic", "algebra", "geometry", "calculus", "trigonometry", "statistics"];

export default function PracticePage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const { currentLanguage, t } = useLanguage();

    const [topic, setTopic] = useState("arithmetic");
    const [grade, setGrade] = useState<number | "all">("all");
    const [pool, setPool] = useState<Problem[]>([]);
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [streak, setStreak] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [reviewDue, setReviewDue] = useState(0);
    const [reviewMode, setReviewMode] = useState(false);
    const [plan, setPlan] = useState("");
    const [generatingPlan, setGeneratingPlan] = useState(false);
    const [aiHelp, setAiHelp] = useState("");
    const [aiStreaming, setAiStreaming] = useState(false);
    const [error, setError] = useState(false);
    const aiBoxRef = useRef<HTMLDivElement>(null);

    const current = pool[index];

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    const loadProblems = useCallback(
        async (topicOverride?: string, gradeOverride?: number | "all", review = false) => {
            setLoading(true);
            setError(false);
            setSelected(null);
            setAiHelp("");
            const topicParam = topicOverride ?? topic;
            const gradeParam = gradeOverride ?? grade;
            const params = new URLSearchParams({
                topic: topicParam,
                language: currentLanguage.code,
            });
            if (gradeParam !== "all") {
                params.set("grade", String(gradeParam));
            }
            params.set("limit", "50");
            try {
                const res = await apiFetch(`/api/problems?${params}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                setPool((data.problems as Problem[]) || []);
                setIndex(0);
                setReviewMode(review);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        },
        [topic, grade, currentLanguage.code],
    );

    useEffect(() => {
        if (isAuthenticated) {
            loadProblems();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, currentLanguage.code]);

    useEffect(() => {
        if (isAuthenticated) {
            apiFetch("/api/review")
                .then((r) => (r.ok ? r.json() : { items: [] }))
                .then((d) => setReviewDue((d.items as ReviewItem[]).length || 0))
                .catch(() => {});
            apiFetch("/api/study-plan")
                .then((r) => (r.ok ? r.json() : { plan: "" }))
                .then((d) => setPlan(d.plan || ""))
                .catch(() => {});
        }
    }, [isAuthenticated]);

    const startReview = useCallback(() => {
        apiFetch("/api/review")
            .then((r) => (r.ok ? r.json() : { items: [] }))
            .then(async (d) => {
                const items = (d.items as ReviewItem[]) || [];
                if (items.length === 0) {
                    return;
                }
                setPool(items);
                setIndex(0);
                setReviewMode(true);
                setSelected(null);
                setAiHelp("");
            })
            .catch(() => {});
    }, []);

    const handleSelect = useCallback(
        async (optionIndex: number) => {
            if (selected !== null || !current) return;
            setSelected(optionIndex);
            const correct = optionIndex === current.answerIndex;
            setTotalCount((c) => c + 1);
            if (correct) {
                setCorrectCount((c) => c + 1);
                setStreak((s) => s + 1);
            } else {
                setStreak(0);
            }
            try {
                await apiFetch("/api/problems/answer", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ problemId: current.id, selectedIndex: optionIndex }),
                });
            } catch {
                // grading recorded optimistically; ignore network errors here
            }
            if (aiBoxRef.current) {
                aiBoxRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        },
        [selected, current],
    );

    const nextQuestion = useCallback(() => {
        if (index + 1 < pool.length) {
            setIndex((i) => i + 1);
            setSelected(null);
            setAiHelp("");
        }
    }, [index, pool.length]);

    const askAI = useCallback(async () => {
        if (!current || aiStreaming) return;
        setAiStreaming(true);
        setAiHelp("");
        try {
            const res = await fetch("/api/chat/message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: "Help me with this practice problem: " + current.question,
                    chatId: null,
                    preferredLanguage: currentLanguage.code,
                }),
            });
            if (!res.ok || !res.body) {
                setAiHelp(t("errorNetwork") || "Failed to get response");
                return;
            }
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let text = "";
            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                text += decoder.decode(value, { stream: true });
                setAiHelp(text);
            }
            setAiHelp(text);
        } catch {
            setAiHelp(t("errorNetwork") || "Failed to get response");
        } finally {
            setAiStreaming(false);
        }
    }, [current, aiStreaming, currentLanguage.code, t]);

    const generatePlan = useCallback(async () => {
        setGeneratingPlan(true);
        try {
            const res = await apiFetch("/api/study-plan/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language: currentLanguage.code }),
            });
            const data = await res.json();
            if (res.ok) {
                setPlan(data.plan || "");
            }
        } finally {
            setGeneratingPlan(false);
        }
    }, [currentLanguage.code]);

    if (isLoading || !isAuthenticated) return null;

    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    return (
        <div className="settings-page">
            <div className="settings-container">
                <div className="settings-header">
                    <Link href="/" className="settings-back-link">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        {t("settingsBackToApp")}
                    </Link>
                    <h1 className="settings-title">{t("practiceTitle") || "Practice"}</h1>
                </div>

                {reviewDue > 0 && (
                    <section className="settings-section">
                        <div className="settings-card practice-review-card">
                            <div className="practice-review-info">
                                <strong>
                                    {t("reviewDue") || "Review due"}: {reviewDue}
                                </strong>
                                <span>{t("reviewDueToday") || "Due today"}</span>
                            </div>
                            <button className="settings-save-btn" onClick={startReview}>
                                {t("reviewStart") || "Start review"}
                            </button>
                        </div>
                    </section>
                )}

                <section className="settings-section">
                    <div className="settings-card">
                        <div className="practice-picker">
                            <div className="practice-picker-group">
                                <label className="practice-picker-label">
                                    {t("practiceTopic") || "Topic"}
                                </label>
                                <div className="practice-chips">
                                    {TOPICS.map((tp) => (
                                        <button
                                            key={tp}
                                            className={`practice-chip ${tp === topic && !reviewMode ? "is-active" : ""}`}
                                            onClick={() => {
                                                setTopic(tp);
                                                loadProblems(tp, grade);
                                            }}
                                        >
                                            {tp}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="practice-picker-group">
                                <label className="practice-picker-label">
                                    {t("practiceGrade") || "Grade"}
                                </label>
                                <select
                                    className="practice-select"
                                    value={String(grade)}
                                    onChange={(e) => {
                                        const value =
                                            e.target.value === "all"
                                                ? "all"
                                                : Number(e.target.value);
                                        setGrade(value);
                                        loadProblems(topic, value);
                                    }}
                                >
                                    <option value="all">All</option>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                                        <option key={g} value={g}>
                                            {g}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="settings-section">
                    <div className="practice-stats">
                        <div className="practice-stat">
                            <span className="practice-stat-value">{streak}</span>
                            <span className="practice-stat-label">
                                {t("practiceStreak") || "Streak"}
                            </span>
                        </div>
                        <div className="practice-stat">
                            <span className="practice-stat-value">{accuracy}%</span>
                            <span className="practice-stat-label">Accuracy</span>
                        </div>
                        <div className="practice-stat">
                            <span className="practice-stat-value">
                                {totalCount}/{Math.max(pool.length, totalCount)}
                            </span>
                            <span className="practice-stat-label">
                                {t("practiceQuestion") || "Question"}
                            </span>
                        </div>
                    </div>

                    {error ? (
                        <div className="settings-card" role="alert">
                            <p style={{ color: "var(--danger)" }}>
                                Could not load problems. Please try again.
                            </p>
                        </div>
                    ) : loading ? (
                        <div className="settings-skeleton">
                            <div className="skeleton" style={{ height: 140 }} />
                        </div>
                    ) : !current ? (
                        <div className="settings-card">
                            <p>{t("practiceDone") || "Done"}</p>
                        </div>
                    ) : (
                        <div className="settings-card practice-question-card">
                            <span className="practice-question-tag">
                                {current.topic} · G{current.grade}
                            </span>
                            <h3 className="practice-question">{current.question}</h3>
                            <div className="practice-options">
                                {current.options.map((opt, i) => {
                                    let className = "practice-option";
                                    if (selected !== null) {
                                        if (i === current.answerIndex) {
                                            className += " is-correct";
                                        } else if (i === selected) {
                                            className += " is-wrong";
                                        } else {
                                            className += " is-dimmed";
                                        }
                                    }
                                    return (
                                        <button
                                            key={i}
                                            className={className}
                                            onClick={() => handleSelect(i)}
                                            disabled={selected !== null}
                                        >
                                            <span className="practice-option-letter">
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                            {selected !== null && (
                                <div className="practice-feedback">
                                    <p
                                        className={
                                            selected === current.answerIndex
                                                ? "practice-correct-text"
                                                : "practice-wrong-text"
                                        }
                                    >
                                        {selected === current.answerIndex
                                            ? t("practiceCorrect") || "Correct!"
                                            : t("practiceIncorrect") || "Not quite."}
                                    </p>
                                    <p className="practice-explanation">
                                        <strong>
                                            {t("practiceExplanation") || "Explanation"}:{" "}
                                        </strong>
                                        {current.explanation}
                                    </p>
                                    <div className="practice-actions">
                                        <button
                                            className="practice-ask-btn"
                                            onClick={askAI}
                                            disabled={aiStreaming}
                                        >
                                            {t("practiceAskAI") || "Ask AI for help"}
                                        </button>
                                        <button
                                            className="settings-save-btn"
                                            onClick={nextQuestion}
                                        >
                                            {t("practiceNext") || "Next question"}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {aiHelp && (
                                <div className="practice-ai-help" ref={aiBoxRef}>
                                    <strong>{t("practiceAskAI") || "Ask AI for help"}</strong>
                                    <p className="practice-ai-text">{aiHelp}</p>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <section className="settings-section">
                    <div className="settings-card practice-plan-card">
                        <div className="practice-plan-header">
                            <strong>{t("studyPlanTitle") || "7-day study plan"}</strong>
                            <button
                                className="settings-save-btn"
                                onClick={generatePlan}
                                disabled={generatingPlan}
                            >
                                {t("generatePlan") || "Generate study plan"}
                            </button>
                        </div>
                        {plan ? (
                            <pre className="practice-plan-text">{plan}</pre>
                        ) : (
                            <p className="practice-plan-empty">
                                {t("studyPlan") || "Study plan"} —{" "}
                                {t("generatePlan") || "Generate study plan"}
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
