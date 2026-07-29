import type { ChatMessageDto, Message } from './message';

export interface ChatRequest {
    message: string;
    sessionId?: string | null;
    topic?: string;
    language?: string;
    history?: ChatMessageDto[];
}

export interface ChatResponse {
    sessionId: string | null;
    reply: string;
}

export interface ChatSession {
    id: string;
    title: string;
    preview?: string;
    topic?: string;
    isArchived: boolean;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
    messages?: Message[];
}

export interface UseChatReturn {
    messages: Message[];
    input: string;
    setInput: (val: string) => void;
    isLoading: boolean;
    isStreaming: boolean;
    error: string | null;
    sessionId: string | null;
    pendingImage: { data: string; mimeType: string } | null;
    setPendingImage: (val: { data: string; mimeType: string } | null) => void;
    sendMessage: (text?: string) => Promise<void>;
    clearMessages: () => void;
    handleStopGeneration: () => void;
    handleRegenerate: () => Promise<void>;
}
