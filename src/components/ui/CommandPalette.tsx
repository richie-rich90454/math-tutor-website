"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import FocusTrap from "@/components/ui/FocusTrap";

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onNewChat: () => void;
    onExportChat?: (format: "md" | "txt") => void;
}

interface Command {
    id: string;
    label: string;
    icon: string;
    shortcut?: string;
    action: () => void;
}

export default function CommandPalette({
    isOpen,
    onClose,
    onNewChat,
    onExportChat,
}: CommandPaletteProps) {
    const router = useRouter();
    const { t } = useLanguage();
    const { chatHistory, setCurrentChat } = useChat();
    const { isAuthenticated } = useAuth();
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const commands: Command[] = [
        {
            id: "new-chat",
            label: t("sidebarNewChat") || "New Chat",
            icon: "M12 4v16m8-8H4",
            shortcut: "Ctrl+N",
            action: () => {
                onNewChat();
                onClose();
            },
        },
        {
            id: "settings",
            label: t("settingsTitle") || "Settings",
            icon: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z",
            action: () => {
                router.push("/settings");
                onClose();
            },
        },
        ...(isAuthenticated
            ? [
                  {
                      id: "export-md",
                      label: t("headerExportAsMD") || "Export as Markdown",
                      icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
                      action: () => {
                          onExportChat?.("md");
                          onClose();
                      },
                  },
              ]
            : []),
    ];

    const filtered = query
        ? commands
              .filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
              .concat(
                  chatHistory
                      .filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
                      .slice(0, 5)
                      .map((c) => ({
                          id: `chat-${c.id}`,
                          label: c.title,
                          icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
                          action: () => {
                              setCurrentChat(c);
                              onClose();
                          },
                      })),
              )
        : commands;

    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const executeCommand = useCallback((cmd: Command) => {
        cmd.action();
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (filtered[selectedIndex]) executeCommand(filtered[selectedIndex]);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, filtered, selectedIndex, executeCommand, onClose]);

    useEffect(() => {
        const item = listRef.current?.children[selectedIndex] as HTMLElement;
        item?.scrollIntoView({ block: "nearest" });
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="cmd-backdrop" onClick={onClose}>
            <FocusTrap isActive={isOpen} onDeactivate={onClose}>
                <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="cmd-input-wrapper">
                        <svg
                            className="cmd-search-icon"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t("cmdPlaceholder") || "Type a command or search..."}
                            className="cmd-input"
                        />
                    </div>
                    <div className="cmd-list" ref={listRef}>
                        {filtered.length === 0 && (
                            <div className="cmd-empty">
                                {t("cmdNoResults") || "No results found"}
                            </div>
                        )}
                        {filtered.map((cmd, i) => (
                            <button
                                key={cmd.id}
                                className={`cmd-item ${i === selectedIndex ? "is-selected" : ""}`}
                                onClick={() => executeCommand(cmd)}
                                onMouseEnter={() => setSelectedIndex(i)}
                            >
                                <svg
                                    className="cmd-item-icon"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d={cmd.icon} />
                                </svg>
                                <span className="cmd-item-label">{cmd.label}</span>
                                {cmd.shortcut && (
                                    <span className="cmd-item-shortcut">{cmd.shortcut}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </FocusTrap>
        </div>
    );
}
