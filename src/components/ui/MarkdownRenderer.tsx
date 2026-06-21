"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import ts from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("typescript", ts);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("markup", markup);

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
 * Convert LaTeX-style delimiters to remark-math-compatible delimiters.
 * \(...\) → $...$ (inline)  |  \[...\] → $$...$$ (display)
 */
function normalizeLatex(content: string): string {
    return content
        .replace(/\\\[/g, "$$\n")
        .replace(/\\\]/g, "\n$$")
        .replace(/\\\(/g, "$")
        .replace(/\\\)/g, "$");
}

export default function MarkdownRenderer({
    content,
    className = "",
    onSuggestionClick,
}: MarkdownRendererProps) {
    if (!content) return null;

    const normalizedContent = normalizeLatex(content);
    const { suggestions, cleanContent } = extractSuggestions(normalizedContent);

    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
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
                    code: ({ className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const language = match ? match[1] : "";
                        const isInline = !language;

                        if (!isInline && language) {
                            const codeText = String(children ?? "").replace(/\n$/, "");
                            return (
                                <div className="mdr-code-block">
                                    <div className="mdr-code-lang">{language}</div>
                                    <SyntaxHighlighter
                                        style={oneDark}
                                        language={language}
                                        PreTag="div"
                                        className="mdr-code-pre"
                                        showLineNumbers={true}
                                        customStyle={{
                                            margin: 0,
                                            borderRadius: "0.5rem",
                                            fontSize: "0.875rem",
                                            padding: "1rem",
                                        }}
                                    >
                                        {codeText}
                                    </SyntaxHighlighter>
                                    <button
                                        onClick={(e) => {
                                            navigator.clipboard.writeText(codeText);
                                            const btn = e.currentTarget;
                                            btn.textContent = "Copied!";
                                            setTimeout(() => {
                                                btn.textContent = "Copy";
                                            }, 2000);
                                        }}
                                        className="mdr-copy-btn"
                                    >
                                        Copy
                                    </button>
                                </div>
                            );
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
                        <a href={href} target="_blank" rel="noopener noreferrer" className="mdr-a">
                            {children}
                        </a>
                    ),
                    hr: () => <hr className="mdr-hr" />,
                    strong: ({ children }) => <strong className="mdr-strong">{children}</strong>,
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
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
