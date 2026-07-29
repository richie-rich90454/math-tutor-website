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

export interface UseChatMessagesReturn {
    input: string;
    setInput: (val: string) => void;
    pendingImage: { data: string; mimeType: string } | null;
    setPendingImage: (val: { data: string; mimeType: string } | null) => void;
    messages: Message[];
    isLoading: boolean;
    isStreaming: boolean;
    activeChatId: string | null;
    setActiveChatId: (id: string | null) => void;
    isLoaded: boolean;
    setIsLoaded: (val: boolean) => void;
    sendMessage: (overrideInput?: string) => Promise<void>;
    sendImage: () => Promise<void>;
    handleRegenerate: () => Promise<void>;
    handleStopGeneration: () => void;
    handleEdit: (messageId: string, content: string) => void;
    handleNewChat: () => void;
    handleExport: (format: "md" | "txt") => void;
    handleImageSelect: (imageData: string, mimeType: string) => void;
    chatMessagesRef: { current: HTMLDivElement | null };
    messagesEndRef: { current: HTMLDivElement | null };
    prevMessagesLenRef: { current: number };
}
