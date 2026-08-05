"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

// Syntax highlighting is code-split: react-syntax-highlighter (large) only
// loads when a code block actually renders.
const CodeBlock = dynamic(() => import("@/components/ui/CodeBlock"), {
    loading: () => <div className="mdr-code-pre mdr-code-loading" />,
});

interface MarkdownRendererProps {
    content: string;
    className?: string;
    onSuggestionClick?: (text: string) => void;
}

export function extractSuggestions(content: string): {
    suggestions: string[];
    cleanContent: string;
} {
    const suggestionRegex = /\[SUGGESTION:\s*(.+?)\]/g;
    const suggestions: string[] = [];
    let match;
    while ((match = suggestionRegex.exec(content)) !== null) {
        suggestions.push(match[1].trim());
    }
    const cleanContent = content.replace(/\n?\[SUGGESTION:\s*.+?\]/g, "").trim();
    return { suggestions, cleanContent };
}

/**
 * Convert AI-style LaTeX delimiters to remark-math-compatible delimiters.
 * \(...\) → $...$ (inline)  |  \[...\] → $$...$$ (display)
 * remark-math ignores $...$ spans that start/end with whitespace, so those are trimmed too.
 */
function normalizeLatex(content: string): string {
    return content
        .replace(/\\\[/g, "$$\n")
        .replace(/\\\]/g, "\n$$")
        .replace(/\\\(/g, "$")
        .replace(/\\\)/g, "$")
        .replace(/\$\$\s+([\s\S]+?)\s+\$\$/g, (_, inner: string) => `$$${inner.trim()}$$`)
        .replace(/\$\s+(.+?)\s+\$/g, (_, inner: string) => `$${inner.trim()}$`);
}

// C17: glossary terms (from the B13 sheets bank) highlighted in assistant text
// with a Mandarin tooltip. Zero AI — a post-render DOM pass, so markdown and
// LaTeX stay untouched.
interface VocabTerm {
    term: string;
    mandarin: string;
}

let glossaryPromise: Promise<VocabTerm[]> | null = null;

function loadGlossary(): Promise<VocabTerm[]> {
    if (!glossaryPromise) {
        glossaryPromise = fetch("/api/sheets")
            .then((r) => (r.ok ? r.json() : { sheets: [] }))
            .then((d) => {
                const terms: VocabTerm[] = [];
                for (const sheet of d.sheets || []) {
                    for (const term of sheet.terms || []) {
                        const name = term?.term;
                        if (name && name.length >= 4 && term.mandarin) {
                            terms.push({ term: name, mandarin: term.mandarin });
                        }
                    }
                }
                return terms;
            })
            .catch(() => []);
    }
    return glossaryPromise;
}

function isInsideExcluded(node: Node): boolean {
    let el = node.parentElement;
    while (el) {
        const cls = el.classList;
        if (
            cls.contains("katex") ||
            cls.contains("mdr-vocab") ||
            el.tagName === "CODE" ||
            el.tagName === "PRE" ||
            cls.contains("mdr-code-block")
        ) {
            return true;
        }
        el = el.parentElement;
    }
    return false;
}

function highlightTextNode(node: Text, terms: VocabTerm[]): void {
    const text = node.nodeValue || "";
    if (!text || text.length < 4) return;
    let best: { index: number; length: number; mandarin: string } | null = null;
    for (const t of terms) {
        const lower = text.toLowerCase();
        const termLower = t.term.toLowerCase();
        let idx = lower.indexOf(termLower);
        while (idx !== -1) {
            const before = idx === 0 ? " " : text[idx - 1];
            const afterEnd = idx + t.term.length;
            const after = afterEnd >= text.length ? " " : text[afterEnd];
            if (!/[a-z]/i.test(before) && !/[a-z]/i.test(after)) {
                if (best === null || t.term.length > best.length) {
                    best = { index: idx, length: t.term.length, mandarin: t.mandarin };
                }
                break;
            }
            idx = lower.indexOf(termLower, idx + 1);
        }
    }
    if (!best) return;
    const fragment = document.createDocumentFragment();
    if (best.index > 0) {
        fragment.appendChild(document.createTextNode(text.slice(0, best.index)));
    }
    const mark = document.createElement("span");
    mark.className = "mdr-vocab";
    mark.textContent = text.slice(best.index, best.index + best.length);
    mark.title = `${text.slice(best.index, best.index + best.length)} — ${best.mandarin}`;
    fragment.appendChild(mark);
    if (best.index + best.length < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(best.index + best.length)));
    }
    node.parentNode?.replaceChild(fragment, node);
}

function useVocabHighlight(
    containerRef: React.RefObject<HTMLDivElement | null>,
    content: string,
): void {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        // Already highlighted (unrelated re-render) — leave the DOM alone.
        if (container.querySelector(".mdr-vocab")) return;
        let cancelled = false;
        // Debounce so actively streaming content (which changes every frame)
        // doesn't trigger a glossary TreeWalker walk on every chunk.
        const timer = window.setTimeout(() => {
            loadGlossary().then((terms) => {
                if (cancelled || terms.length === 0) return;
                const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
                const textNodes: Text[] = [];
                let node: Node | null = walker.nextNode();
                while (node) {
                    if (!isInsideExcluded(node)) {
                        textNodes.push(node as Text);
                    }
                    node = walker.nextNode();
                }
                for (const tn of textNodes) {
                    highlightTextNode(tn, terms);
                }
            });
        }, 150);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [containerRef, content]);
}

export default function MarkdownRenderer({
    content,
    className = "",
    onSuggestionClick,
}: MarkdownRendererProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    useVocabHighlight(containerRef, content);

    if (!content) return null;

    const normalizedContent = normalizeLatex(content);
    const { suggestions, cleanContent } = extractSuggestions(normalizedContent);
    return (
        <ErrorBoundary
            fallback={
                <div className={`markdown-content ${className}`} style={{ whiteSpace: "pre-wrap" }}>
                    {cleanContent}
                </div>
            }
        >
            <div ref={containerRef} className={`markdown-content ${className}`}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}
                    components={{
                        h1: ({ children }) => <h1 className="mdr-h1">{children}</h1>,
                        h2: ({ children }) => <h2 className="mdr-h2">{children}</h2>,
                        h3: ({ children }) => <h3 className="mdr-h3">{children}</h3>,
                        h4: ({ children }) => <h4 className="mdr-h4">{children}</h4>,
                        p: ({ children }) => <p className="mdr-p">{children}</p>,
                        ul: ({ children }) => <ul className="mdr-ul">{children}</ul>,
                        ol: ({ children }) => <ol className="mdr-ol">{children}</ol>,
                        li: ({ children }) => <li className="mdr-li">{children}</li>,
                        blockquote: ({ children }) => (
                            <blockquote className="mdr-blockquote">{children}</blockquote>
                        ),
                        code: ({
                            className,
                            children,
                            ...props
                        }: ComponentPropsWithoutRef<"code">) => {
                            const match = /language-(\w+)/.exec(className || "");
                            const language = match ? match[1] : "";
                            const isInline = !language;

                            if (!isInline && language) {
                                const codeText = String(children ?? "").replace(/\n$/, "");
                                return <CodeBlock language={language} code={codeText} />;
                            }

                            return (
                                <code className="mdr-inline-code" {...props}>
                                    {children}
                                </code>
                            );
                        },
                        table: ({ children }) => (
                            <div className="mdr-table-wrapper">
                                <table className="mdr-table">{children}</table>
                            </div>
                        ),
                        thead: ({ children }) => <thead className="mdr-thead">{children}</thead>,
                        tbody: ({ children }) => <tbody className="mdr-tbody">{children}</tbody>,
                        tr: ({ children }) => <tr>{children}</tr>,
                        th: ({ children }) => <th className="mdr-th">{children}</th>,
                        td: ({ children }) => <td className="mdr-td">{children}</td>,
                        a: ({ href, children }) => (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mdr-a"
                            >
                                {children}
                            </a>
                        ),
                        hr: () => <hr className="mdr-hr" />,
                        strong: ({ children }) => (
                            <strong className="mdr-strong">{children}</strong>
                        ),
                        em: ({ children }) => <em className="mdr-em">{children}</em>,
                    }}
                >
                    {cleanContent}
                </ReactMarkdown>
                {suggestions.length > 0 && onSuggestionClick && (
                    <div className="mdr-suggestions">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                className="mdr-suggestion-chip"
                                onClick={() => onSuggestionClick(s)}
                                title={s}
                            >
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}
                                    components={{
                                        p: ({ children }) => <span>{children}</span>,
                                    }}
                                >
                                    {s}
                                </ReactMarkdown>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
}
