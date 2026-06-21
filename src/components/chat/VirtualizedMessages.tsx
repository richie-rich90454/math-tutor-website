"use client";

import { useRef, useEffect, useState, useCallback, ReactNode } from "react";

interface Props {
    children: ReactNode[];
    overscan?: number;
    estimatedHeight?: number;
}

export default function VirtualizedMessages({
    children,
    overscan = 3,
    estimatedHeight = 120,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

    const updateVisibleRange = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const scrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const totalItems = Array.isArray(children) ? children.length : 0;

        const startIdx = Math.max(0, Math.floor(scrollTop / estimatedHeight) - overscan);
        const visibleCount = Math.ceil(containerHeight / estimatedHeight) + overscan * 2;
        const endIdx = Math.min(totalItems, startIdx + visibleCount);

        setVisibleRange({ start: startIdx, end: endIdx });
    }, [overscan, estimatedHeight, children]);

    useEffect(() => {
        updateVisibleRange();
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener("scroll", updateVisibleRange, { passive: true });
        return () => container.removeEventListener("scroll", updateVisibleRange);
    }, [updateVisibleRange]);

    const items = Array.isArray(children) ? children : [];
    if (items.length <= 50) {
        return <>{children}</>;
    }

    const visibleItems = items.slice(visibleRange.start, visibleRange.end);
    const topSpacer = visibleRange.start * estimatedHeight;
    const bottomSpacer = (items.length - visibleRange.end) * estimatedHeight;

    return (
        <>
            {topSpacer > 0 && <div style={{ height: topSpacer }} aria-hidden="true" />}
            {visibleItems}
            {bottomSpacer > 0 && <div style={{ height: bottomSpacer }} aria-hidden="true" />}
        </>
    );
}
