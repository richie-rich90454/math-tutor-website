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
                        <h1 className="mt-4 mb-3 text-xl font-bold text-gray-900">{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="mt-3 mb-2 text-lg font-semibold text-gray-900">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="mt-2 mb-1 text-base font-semibold text-gray-900">
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="mt-2 mb-1 text-sm font-semibold text-gray-900">
                            {children}
                        </h4>
                    ),
                    p: ({ children }) => (
                        <p className="mb-3 text-sm leading-relaxed text-gray-800">{children}</p>
                    ),
                    ul: ({ children }) => (
                        <ul className="mb-3 list-inside list-disc space-y-1 text-sm text-gray-800">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="mb-3 list-inside list-decimal space-y-1 text-sm text-gray-800">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => <li className="ml-4 leading-relaxed">{children}</li>,
                    blockquote: ({ children }) => (
                        <blockquote className="mb-3 rounded-r-lg border-l-4 border-gray-300 bg-gray-50 py-2 pl-4 text-sm text-gray-700 italic">
                            {children}
                        </blockquote>
                    ),
                    code: ({ inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const language = match ? match[1] : "";

                        if (!inline && language) {
                            return (
                                <div className="group relative mb-4">
                                    <div className="absolute top-0 right-0 px-2 py-1 text-xs tracking-wide text-gray-400 uppercase">
                                        {language}
                                    </div>
                                    <SyntaxHighlighter
                                        style={oneDark}
                                        language={language}
                                        PreTag="div"
                                        className="!mt-0 rounded-lg"
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
                                        className="absolute top-2 right-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 opacity-0 transition-colors group-hover:opacity-100 hover:bg-gray-600"
                                    >
                                        Copy
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <code
                                className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    table: ({ children }) => (
                        <div className="mb-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-300 rounded-lg border border-gray-300">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
                    tbody: ({ children }) => (
                        <tbody className="divide-y divide-gray-200 bg-white">{children}</tbody>
                    ),
                    tr: ({ children }) => (
                        <tr className="transition-colors hover:bg-gray-50">{children}</tr>
                    ),
                    th: ({ children }) => (
                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-900">
                            {children}
                        </td>
                    ),
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline decoration-1 underline-offset-2 transition-colors hover:text-blue-800"
                        >
                            {children}
                        </a>
                    ),
                    hr: () => <hr className="my-6 border-gray-200" />,
                    strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900">{children}</strong>
                    ),
                    em: ({ children }) => <em className="italic">{children}</em>,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
