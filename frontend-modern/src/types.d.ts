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

declare module 'wouter' {
    import type { ComponentType, ComponentChildren } from 'preact';
    interface RouteProps {
        path: string;
        children?: ComponentChildren;
        component?: ComponentType<unknown>;
    }
    const Route: ComponentType<RouteProps>;
    const Switch: ComponentType<{ children: ComponentChildren }>;
    const Link: ComponentType<{ href: string; children: ComponentChildren; className?: string }>;
    export function useLocation(): [string, (to: string) => void];
    export function useRoute(pattern: string): [boolean, Record<string, string> | null];
    export { Route, Switch, Link };
    export default { Route, Switch, Link };
}

interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
}
