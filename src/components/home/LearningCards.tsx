"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
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

export default function LearningCards() {
    const { t, currentLanguage } = useLanguage();
    const { isAuthenticated } = useAuth();
    const [problemOfDay, setProblemOfDay] = useState<Problem | null>(null);
    const [reviewDue, setReviewDue] = useState(0);

    useEffect(() => {
        apiFetch(`/api/problem-of-day?language=${currentLanguage.code}`)
            .then((r) => (r.ok ? r.json() : { problem: null }))
            .then((d) => setProblemOfDay(d.problem || null))
            .catch(() => {});
    }, [currentLanguage.code]);

    useEffect(() => {
        if (!isAuthenticated) {
            setReviewDue(0);
            return;
        }
        apiFetch("/api/review")
            .then((r) => (r.ok ? r.json() : { items: [] }))
            .then((d) => setReviewDue((d.items as unknown[]).length || 0))
            .catch(() => {});
    }, [isAuthenticated]);

    const hasCards = !!problemOfDay || (isAuthenticated && reviewDue > 0);

    if (!hasCards) return null;

    return (
        <div className="learning-cards">
            {problemOfDay && (
                <Link href="/practice" className="learning-card">
                    <span className="learning-card-tag">
                        {t("problemOfDay") || "Problem of the day"}
                    </span>
                    <span className="learning-card-text">{problemOfDay.question}</span>
                    <span className="learning-card-meta">
                        {problemOfDay.topic} · G{problemOfDay.grade}
                    </span>
                </Link>
            )}
            {isAuthenticated && reviewDue > 0 && (
                <Link href="/practice" className="learning-card learning-card-accent">
                    <span className="learning-card-tag">{t("reviewDue") || "Review due"}</span>
                    <span className="learning-card-text">
                        {reviewDue} {t("reviewDueToday") || "due today"}
                    </span>
                    <span className="learning-card-meta">
                        {t("reviewStart") || "Start review"} →
                    </span>
                </Link>
            )}
        </div>
    );
}
