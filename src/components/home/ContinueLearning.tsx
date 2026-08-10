"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

interface ContinueLearningProps {
    onSelect: (text: string) => void;
}

function pickTopics(data: { topic?: string }[] | undefined, limit: number): string[] {
    if (!data) return [];
    return data
        .map((x) => x.topic)
        .filter((x): x is string => !!x && x.trim().length > 0)
        .slice(0, limit);
}

export default function ContinueLearning({ onSelect }: ContinueLearningProps) {
    const { t } = useLanguage();
    const { isAuthenticated } = useAuth();
    const [recent, setRecent] = useState<string[]>([]);
    const [weak, setWeak] = useState<string[]>([]);

    useEffect(() => {
        if (!isAuthenticated) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await apiFetch("/api/progress");
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled) setRecent(pickTopics(data?.topics, 6));
                }
            } catch {}
            try {
                const res = await apiFetch("/api/progress/suggestions");
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled) setWeak(pickTopics(data?.weakTopics, 4));
                }
            } catch {}
        })();
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated]);

    if (recent.length === 0 && weak.length === 0) {
        return null;
    }

    return (
        <div className="continue-learning">
            <h2 className="continue-learning-title">{t("continueLearning")}</h2>
            {recent.length > 0 && (
                <div className="continue-learning-group">
                    <span className="continue-learning-label">{t("recentTopics")}</span>
                    <div className="continue-learning-chips">
                        {recent.map((topic) => (
                            <button
                                key={"r-" + topic}
                                type="button"
                                className="continue-learning-chip"
                                onClick={() => onSelect(topic)}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {weak.length > 0 && (
                <div className="continue-learning-group">
                    <span className="continue-learning-label">{t("weakTopics")}</span>
                    <div className="continue-learning-chips">
                        {weak.map((topic) => (
                            <button
                                key={"w-" + topic}
                                type="button"
                                className="continue-learning-chip is-weak"
                                onClick={() => onSelect(topic)}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
