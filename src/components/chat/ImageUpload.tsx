"use client";

import { useRef, useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ImageUploadProps {
    onImageSelect: (imageData: string, mimeType: string) => void;
    disabled?: boolean;
}

export default function ImageUpload({ onImageSelect, disabled }: ImageUploadProps) {
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const processFile = useCallback(
        (file: File) => {
            if (!file.type.startsWith("image/")) return;
            if (file.size > 20 * 1024 * 1024) {
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                onImageSelect(dataUrl, file.type);
            };
            reader.readAsDataURL(file);
        },
        [onImageSelect]
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
            e.target.value = "";
        },
        [processFile]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) processFile(file);
        },
        [processFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="ia-image-btn"
                title={t("inputAttachImage") || "Attach image"}
                aria-label={t("inputAttachImage") || "Attach image"}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={isDragOver ? { background: "var(--accent)", color: "var(--fg-inverse)" } : undefined}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            </button>
        </>
    );
}
