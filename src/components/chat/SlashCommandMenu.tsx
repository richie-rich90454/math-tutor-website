"use client";

import { useState, useRef, useEffect } from "react";

interface SlashCommandMenuProps {
    isOpen: boolean;
    onSelect: (command: string) => void;
    onClose: () => void;
    position: { top: number; left: number };
}

const COMMANDS = [
    { command: "/explain", label: "Explain a concept", description: "Get a detailed explanation of a math topic" },
    { command: "/solve", label: "Solve a problem", description: "Step through solving a specific problem" },
    { command: "/practice", label: "Practice problems", description: "Generate practice problems on a topic" },
    { command: "/quiz", label: "Take a quiz", description: "Test your knowledge with a quick quiz" },
];

export default function SlashCommandMenu({ isOpen, onSelect, onClose, position }: SlashCommandMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex((i) => Math.min(i + 1, COMMANDS.length - 1));
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex((i) => Math.max(i - 1, 0));
                    break;
                case "Enter":
                    e.preventDefault();
                    if (COMMANDS[selectedIndex]) {
                        onSelect(COMMANDS[selectedIndex].command);
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    onClose();
                    break;
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, selectedIndex, onSelect, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={ref}
            className="slash-menu"
            style={{ top: position.top, left: position.left }}
        >
            {COMMANDS.map((cmd, i) => (
                <button
                    key={cmd.command}
                    className={`slash-menu-item ${i === selectedIndex ? "is-selected" : ""}`}
                    onClick={() => onSelect(cmd.command)}
                    onMouseEnter={() => setSelectedIndex(i)}
                >
                    <span className="slash-menu-command">{cmd.command}</span>
                    <span className="slash-menu-label">{cmd.label}</span>
                    <span className="slash-menu-desc">{cmd.description}</span>
                </button>
            ))}
        </div>
    );
}