"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiFetch } from "@/lib/api-client";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import type { Translations } from "@/lib/translations";

interface Formula {
    name: string;
    formula: string;
    native: string;
    mandarin: string;
}

interface Term {
    term: string;
    native: string;
    mandarin: string;
}

interface SheetTopic {
    topic: string;
    formulas: Formula[];
    terms: Term[];
}

const TOPICS = ["arithmetic", "algebra", "geometry", "calculus", "trigonometry", "statistics"];

const TOPIC_KEYS: Record<string, string> = {
    arithmetic: "topicArithmetic",
    algebra: "topicAlgebra",
    geometry: "topicGeometry",
    calculus: "topicCalculus",
    trigonometry: "topicTrigonometry",
    statistics: "topicStatistics",
};

function topicLabel(topic: string, t: (key: keyof Translations) => string): string {
    const key = TOPIC_KEYS[topic];
    return key ? t(key as keyof Translations) || topic : topic;
}

export default function SheetsPage() {
    const { t } = useLanguage();
    const [active, setActive] = useState("algebra");
    const [sheets, setSheets] = useState<SheetTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setError(false);
        apiFetch("/api/sheets")
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((d) => {
                setSheets(d.sheets as SheetTopic[]);
                if (d.sheets?.length) {
                    setActive(d.sheets[0].topic);
                }
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const current = sheets.find((s) => s.topic === active);

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
                    <h1 className="settings-title">
                        {t("sheetsTitle") || "Formula & Glossary Sheets"}
                    </h1>
                </div>

                <section className="settings-section">
                    <div className="practice-chips">
                        {TOPICS.map((tp) => (
                            <button
                                key={tp}
                                className={`practice-chip ${tp === active ? "is-active" : ""}`}
                                onClick={() => setActive(tp)}
                            >
                                {topicLabel(tp, t)}
                            </button>
                        ))}
                    </div>
                </section>

                {loading ? (
                    <div className="settings-skeleton">
                        <div className="skeleton" style={{ height: 200 }} />
                    </div>
                ) : error ? (
                    <div className="settings-card" role="alert">
                        <p style={{ color: "var(--danger)" }}>
                            {t("sheetsLoadError") || "Could not load sheets. Please try again."}
                        </p>
                    </div>
                ) : current ? (
                    <>
                        <section className="settings-section">
                            <h2 className="settings-section-title">
                                {t("sheetsFormula") || "Formulas"}
                            </h2>
                            <div className="settings-card">
                                {current.formulas.map((f, i) => (
                                    <div key={i} className="sheet-row">
                                        <span className="sheet-formula-name">{f.name}</span>
                                        <MarkdownRenderer content={"$$" + f.formula + "$$"} />
                                        <span className="sheet-mandarin">{f.mandarin}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section className="settings-section">
                            <h2 className="settings-section-title">
                                {t("sheetsTerm") || "Key terms"}
                            </h2>
                            <div className="settings-card">
                                {current.terms.map((term, i) => (
                                    <div key={i} className="sheet-row sheet-term-row">
                                        <span className="sheet-term">{term.term}</span>
                                        <span className="sheet-mandarin">
                                            {t("sheetsMandarin") || "Mandarin"}: {term.mandarin}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                ) : null}
            </div>
        </div>
    );
}
