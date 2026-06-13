"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
// Use the light build and register only needed languages to reduce bundle size
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import ts from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Register a minimal set of languages commonly used in the app
SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("typescript", ts);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("markup", markup);

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    h1: ({ children }) => (
                        <h1 className="mdr-h1">{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="mdr-h2">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="mdr-h3">
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="mdr-h4">
                            {children}
                        </h4>
                    ),
                    p: ({ children }) => (
                        <p className="mdr-p">{children}</p>
                    ),
                    ul: ({ children }) => (
                        <ul className="mdr-ul">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="mdr-ol">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => <li className="mdr-li">{children}</li>,
                    blockquote: ({ children }) => (
                        <blockquote className="mdr-blockquote">
                            {children}
                        </blockquote>
                    ),
                    code: ({ inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const language = match ? match[1] : "";

                        if (!inline && language) {
                            return (
                                <div className="mdr-code-block">
                                    <div className="mdr-code-lang">
                                        {language}
                                    </div>
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
                                        {String(children).replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(String(children));
                                            const btn = document.activeElement as HTMLButtonElement;
                                            const originalText = btn.innerText;
                                            btn.innerText = "Copied!";
                                            setTimeout(() => {
                                                btn.innerText = originalText;
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
                            <code
                                className="mdr-inline-code"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    table: ({ children }) => (
                        <div className="mdr-table-wrapper">
                            <table className="mdr-table">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => <thead className="mdr-thead">{children}</thead>,
                    tbody: ({ children }) => (
                        <tbody className="mdr-tbody">{children}</tbody>
                    ),
                    tr: ({ children }) => (
                        <tr>{children}</tr>
                    ),
                    th: ({ children }) => (
                        <th className="mdr-th">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="mdr-td">
                            {children}
                        </td>
                    ),
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
                {content}
            </ReactMarkdown>
        </div>
    );
}
