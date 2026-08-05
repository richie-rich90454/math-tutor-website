"use client";

import { useRef, useEffect, useState, useCallback, ReactNode } from "react";

interface Props {
    children: ReactNode[];
    overscan?: number;
    estimatedHeight?: number;
    scrollRef?: React.RefObject<HTMLDivElement | null>;
}

// Measured virtualization: each rendered row reports its real height via
// ResizeObserver (no fixed-height guess), so long chats scroll without jumps
// even when rows contain KaTeX, code blocks, or streaming text.
export default function VirtualizedMessages({
    children,
    overscan = 3,
    estimatedHeight = 120,
    scrollRef,
}: Props) {
    const fallbackRef = useRef<HTMLDivElement>(null);
    const heightsRef = useRef<Map<number, number>>(new Map());
    const [, force] = useState(0);
    const [range, setRange] = useState({ start: 0, end: 20 });

    const items = Array.isArray(children) ? children : [];
    const count = items.length;

    const updateRange = useCallback(() => {
        const container = scrollRef?.current ?? fallbackRef.current;
        if (!container) return;
        const top = container.scrollTop;
        const height = container.clientHeight;

        let off = 0;
        let start = 0;
        const h = heightsRef.current;
        for (let i = 0; i < count; i++) {
            const rh = h.get(i) ?? estimatedHeight;
            if (off + rh > top) {
                start = i;
                break;
            }
            off += rh;
            start = i + 1;
        }
        start = Math.max(0, start - overscan);

        let acc = 0;
        let end = start;
        for (let i = start; i < count; i++) {
            acc += h.get(i) ?? estimatedHeight;
            end = i + 1;
            if (acc > top - off + height + overscan * estimatedHeight) break;
        }
        end = Math.min(count, end + overscan);
        setRange({ start, end });
    }, [count, estimatedHeight, overscan, scrollRef]);

    // Scroll + resize of the scroll container.
    useEffect(() => {
        const container = scrollRef?.current ?? fallbackRef.current;
        if (!container) return;
        let raf = 0;
        const onScroll = () => {
            if (!raf) {
                raf = requestAnimationFrame(() => {
                    raf = 0;
                    updateRange();
                });
            }
        };
        const ro = new ResizeObserver(() => updateRange());
        container.addEventListener("scroll", onScroll, { passive: true });
        ro.observe(container);
        updateRange();
        return () => {
            container.removeEventListener("scroll", onScroll);
            ro.disconnect();
            if (raf) cancelAnimationFrame(raf);
        };
    }, [updateRange, scrollRef]);

    const updateRangeRef = useRef(updateRange);
    useEffect(() => {
        updateRangeRef.current = updateRange;
    }, [updateRange]);

    const measure = useCallback(
        (index: number) => (el: HTMLElement | null) => {
            if (!el) return;
            const apply = (h: number) => {
                if (Math.abs((heightsRef.current.get(index) ?? -1) - h) > 0.5) {
                    heightsRef.current.set(index, h);
                    force((n) => n + 1);
                    updateRangeRef.current();
                }
            };
            apply(el.offsetHeight);
            const ro = new ResizeObserver((entries) => {
                apply(entries[0]?.contentRect.height ?? el.offsetHeight);
            });
            ro.observe(el);
            el.setAttribute("data-virt-index", String(index));
        },
        [],
    );

    if (count <= 50) {
        return <>{children}</>;
    }

    const h = heightsRef.current;
    let startOff = 0;
    for (let i = 0; i < range.start; i++) {
        startOff += h.get(i) ?? estimatedHeight;
    }
    let endOff = startOff;
    for (let i = range.start; i < range.end; i++) {
        endOff += h.get(i) ?? estimatedHeight;
    }
    let total = endOff;
    for (let i = range.end; i < count; i++) {
        total += h.get(i) ?? estimatedHeight;
    }

    const visible = items.slice(range.start, range.end).map((child, i) => {
        const index = range.start + i;
        return (
            <div key={index} ref={measure(index)}>
                {child}
            </div>
        );
    });

    return (
        <>
            {startOff > 0 && <div style={{ height: startOff }} aria-hidden="true" />}
            {visible}
            {total - endOff > 0 && <div style={{ height: total - endOff }} aria-hidden="true" />}
        </>
    );
}
