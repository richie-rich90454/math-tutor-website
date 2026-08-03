"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UsagePayload {
    today?: { requestTokens: number; responseTokens: number; total: number; estCostUsd: number };
    cacheHits?: number;
}

function formatTokens(value: number): string {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
    if (value >= 1_000) return (value / 1_000).toFixed(1) + "k";
    return String(value);
}

export default function UsageMeter({ refreshKey = 0 }: { refreshKey?: number }) {
    const { t } = useLanguage();
    const [usage, setUsage] = useState<UsagePayload | null>(null);

    useEffect(() => {
        let active = true;
        fetch("/api/usage", { headers: { Accept: "application/json" } })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (active && data) setUsage(data);
            })
            .catch(() => undefined);
        return () => {
            active = false;
        };
    }, [refreshKey]);

    if (!usage?.today) return null;

    const today = usage.today;
    return (
        <span className="app-usage-meter">
            {t("usageToday")}: {formatTokens(today.total)} tok · ${today.estCostUsd.toFixed(4)}
            {typeof usage.cacheHits === "number" && usage.cacheHits > 0 && (
                <>
                    {" "}
                    · {usage.cacheHits} {t("usageCacheHits")}
                </>
            )}
        </span>
    );
}
