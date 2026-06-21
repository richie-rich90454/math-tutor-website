"use client";

interface SkeletonProps {
    className?: string;
    width?: string;
    height?: string;
    variant?: "text" | "circle" | "card";
}

export default function Skeleton({ className = "", width, height, variant = "text" }: SkeletonProps) {
    const classes = [
        "skeleton",
        variant === "circle" ? "skeleton-circle" : "",
        variant === "card" ? "skeleton-card" : variant === "text" ? "skeleton-text" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    const style: Record<string, string> = {};
    if (width) style.width = width;
    if (height) style.height = height;

    return <div className={classes} style={style} role="status" aria-label="Loading..." />;
}