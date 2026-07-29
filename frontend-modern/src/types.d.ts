declare module 'react-markdown' {
    import type { ComponentType } from 'preact';
    interface ReactMarkdownProps {
        children: string;
        remarkPlugins?: unknown[];
        rehypePlugins?: unknown[];
    }
    const ReactMarkdown: ComponentType<ReactMarkdownProps>;
    export default ReactMarkdown;
}

declare module 'remark-math' {
    const remarkMath: unknown;
    export default remarkMath;
}

declare module 'rehype-katex' {
    const rehypeKatex: unknown;
    export default rehypeKatex;
}
