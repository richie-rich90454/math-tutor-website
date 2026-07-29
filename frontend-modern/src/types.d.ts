declare module 'react-markdown' {
    import type { ComponentType } from 'preact';
    interface ReactMarkdownProps {
        children: string;
        remarkPlugins?: unknown[];
        rehypePlugins?: unknown[];
        components?: Record<string, unknown>;
    }
    const ReactMarkdown: ComponentType<ReactMarkdownProps>;
    export default ReactMarkdown;
}

declare module 'remark-math' {
    const remarkMath: unknown;
    export default remarkMath;
}

declare module 'remark-gfm' {
    const remarkGfm: unknown;
    export default remarkGfm;
}

declare module 'rehype-katex' {
    const rehypeKatex: unknown;
    export default rehypeKatex;
}

declare module 'react-syntax-highlighter' {
    const content: { registerLanguage: (name: string, lang: unknown) => void; PrismLight: unknown };
    export default content;
    export const PrismLight: { registerLanguage: (name: string, lang: unknown) => void };
}

declare module 'react-syntax-highlighter/dist/esm/languages/prism/*' {
    const lang: unknown;
    export default lang;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
    const style: unknown;
    export const oneDark: unknown;
}
