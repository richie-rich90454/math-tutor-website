"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiFetch } from "@/lib/api-client";

interface PublicMessage {
    role: string;
    content: string;
    created_at: string;
}

export default function PublicChatPage() {
    const params = useParams<{ token: string }>();
    const { t } = useLanguage();
    const [title, setTitle] = useState("");
    const [messages, setMessages] = useState<PublicMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!params?.token) return;
        apiFetch(`/api/public/chat/${params.token}`)
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((d) => {
                setTitle(d.title || "");
                setMessages(d.messages || []);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [params?.token]);

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
                    <h1 className="settings-title">{title || t("share") || "Shared chat"}</h1>
                </div>

                {loading ? (
                    <div className="settings-skeleton">
                        <div className="skeleton" style={{ height: 200 }} />
                    </div>
                ) : error ? (
                    <div className="settings-card" role="alert">
                        <p style={{ color: "var(--danger)" }}>
                            {t("errorNetwork") || "Could not load this shared chat."}
                        </p>
                    </div>
                ) : (
                    <div className="settings-card">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`public-msg public-msg-${m.role === "user" ? "user" : "assistant"}`}
                            >
                                <span className="public-msg-role">
                                    {m.role === "user" ? t("chatYou") : t("ciAIMathTutor")}
                                </span>
                                <p className="public-msg-content">{m.content}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
