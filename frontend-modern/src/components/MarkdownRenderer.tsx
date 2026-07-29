import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export function extractSuggestions(content: string): string[] {
    const results: string[] = [];
    const regex = /\[SUGGESTION:\s*(.*?)\]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        results.push(match[1].trim());
    }
    if (results.length > 0) {
        return results;
    }
    return [];
}

export function MarkdownRenderer({ content }: { content: string }) {
    return (
        <div class="markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
