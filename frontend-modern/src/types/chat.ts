import type { ChatMessageDto } from "./message";
import type { Message } from "./message";

export interface ChatRequest {
    message: string;
    sessionId?: string | null;
    topic?: string;
    language?: string;
    history?: ChatMessageDto[];
}

export interface ChatResponse {
    sessionId: string;
    reply: string;
}

export interface UseChatReturn {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    sessionId: string | null;
    sendMessage: (text: string) => Promise<void>;
    clearMessages: () => void;
}
