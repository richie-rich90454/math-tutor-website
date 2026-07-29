import type { Message } from "./message";

export interface AppProps {}

export interface HomeProps {
    onStart: () => void;
}

export interface ChatProps {}

export interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
}

export interface InputAreaProps {
    onSend: (text: string) => void;
    isLoading: boolean;
}
