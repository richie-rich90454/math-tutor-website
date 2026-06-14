"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface TopicData {
    topic: string;
    count: number;
}

interface RecentChat {
    id: string;
    title: string;
    topic: string | null;
    created_at: string;
}

interface ProgressData {
    totalChats: number;
    totalMessages: number;
    topics: TopicData[];
    recentChats: RecentChat[];
    dailyActivity: { date: string; count: number }[];
    memberSince: string | null;
    longestStreak: number;
}

const TOPIC_COLORS: Record<string, string> = {
    algebra: "#6366f1",
    geometry: "#10b981",
    calculus: "#f59e0b",
    trigonometry: "#ef4444",
    statistics: "#8b5cf6",
    arithmetic: "#06b6d4",
    "linear algebra": "#ec4899",
    "number theory": "#14b8a6",
    "differential equations": "#f97316",
    "word problems": "#64748b",
};

export default function ProgressPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuth();
    const { t } = useLanguage();
    const [data, setData] = useState<ProgressData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetch("/api/progress")
                .then((r) => r.json())
                .then(setData)
                .catch(() => {})
                .finally(() => setLoading(false));
        }
    }, [isAuthenticated]);

    if (isLoading || !isAuthenticated) return null;

    const maxTopicCount = data ? Math.max(...data.topics.map((t) => t.count), 1) : 1;

    return (
        <div className="settings-page">
            <div className="settings-container">
                <div className="settings-header">
                    <Link href="/" className="settings-back-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        {t("settingsBackToApp")}
                    </Link>
                    <h1 className="settings-title">{t("progressTitle") || "Your Progress"}</h1>
                </div>

                {loading ? (
                    <div className="settings-skeleton">
                        <div className="skeleton" style={{ height: 120, marginBottom: "var(--space-6)" }} />
                        <div className="skeleton" style={{ height: 200, marginBottom: "var(--space-6)" }} />
                    </div>
                ) : data ? (
                    <>
                        {/* Stats Cards */}
                        <div className="progress-stats">
                            <div className="progress-stat-card">
                                <div className="progress-stat-value">{data.totalChats}</div>
                                <div className="progress-stat-label">{t("progressConversations") || "Conversations"}</div>
                            </div>
                            <div className="progress-stat-card">
                                <div className="progress-stat-value">{data.totalMessages}</div>
                                <div className="progress-stat-label">{t("progressMessages") || "Messages"}</div>
                            </div>
                            <div className="progress-stat-card">
                                <div className="progress-stat-value">{data.longestStreak}</div>
                                <div className="progress-stat-label">{t("progressStreak") || "Day Streak"}</div>
                            </div>
                            <div className="progress-stat-card">
                                <div className="progress-stat-value">{data.topics.length}</div>
                                <div className="progress-stat-label">{t("progressTopics") || "Topics Explored"}</div>
                            </div>
                        </div>

                        {/* Topics */}
                        {data.topics.length > 0 && (
                            <section className="settings-section">
                                <h2 className="settings-section-title">{t("progressTopicsExplored") || "Topics Explored"}</h2>
                                <div className="settings-card">
                                    {data.topics.map((topic) => (
                                        <div key={topic.topic} className="progress-topic-row">
                                            <div className="progress-topic-info">
                                                <span
                                                    className="progress-topic-dot"
                                                    style={{ background: TOPIC_COLORS[topic.topic] || "#6b7280" }}
                                                />
                                                <span className="progress-topic-name">{topic.topic}</span>
                                            </div>
                                            <div className="progress-topic-bar-wrapper">
                                                <div
                                                    className="progress-topic-bar"
                                                    style={{
                                                        width: `${(topic.count / maxTopicCount) * 100}%`,
                                                        background: TOPIC_COLORS[topic.topic] || "#6b7280",
                                                    }}
                                                />
                                            </div>
                                            <span className="progress-topic-count">{topic.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Recent Activity */}
                        {data.recentChats.length > 0 && (
                            <section className="settings-section">
                                <h2 className="settings-section-title">{t("progressRecentActivity") || "Recent Activity"}</h2>
                                <div className="settings-card">
                                    {data.recentChats.map((chat) => (
                                        <div key={chat.id} className="progress-activity-row">
                                            <div className="progress-activity-info">
                                                <span className="progress-activity-title">{chat.title}</span>
                                                {chat.topic && (
                                                    <span className="progress-activity-topic" style={{ color: TOPIC_COLORS[chat.topic] || "#6b7280" }}>
                                                        {chat.topic}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="progress-activity-date">
                                                {new Date(chat.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Activity Heatmap (simple) */}
                        {data.dailyActivity.length > 0 && (
                            <section className="settings-section">
                                <h2 className="settings-section-title">{t("progressActivity") || "Last 30 Days"}</h2>
                                <div className="settings-card" style={{ padding: "var(--space-4)" }}>
                                    <div className="progress-heatmap">
                                        {Array.from({ length: 30 }, (_, i) => {
                                            const d = new Date();
                                            d.setDate(d.getDate() - (29 - i));
                                            const dateStr = d.toISOString().split("T")[0];
                                            const entry = data.dailyActivity.find((a) => a.date === dateStr);
                                            const count = entry?.count || 0;
                                            const intensity = Math.min(count / 3, 1);
                                            return (
                                                <div
                                                    key={dateStr}
                                                    className="progress-heatmap-cell"
                                                    style={{
                                                        background: count === 0
                                                            ? "var(--bg-hover)"
                                                            : `rgba(99, 102, 241, ${0.2 + intensity * 0.8})`,
                                                    }}
                                                    title={`${dateStr}: ${count} chats`}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    );
}
