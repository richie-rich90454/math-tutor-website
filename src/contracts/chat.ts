// Shared API wire contracts between the Next.js client and the Spring Boot
// backend. The backend Java records mirror these shapes; keep them in sync
// (see docs/api-contract.md for the full endpoint reference).

export interface ApiMessage {
    id: string;
    content: string;
    role: string;
    created_at: string;
    is_pinned?: number;
}

export interface ChatSession {
    id: string;
    title: string;
    timestamp: string;
    preview: string;
    topic?: string | null;
    isPinned?: boolean;
    messages: ChatMessage[];
}

export interface ChatMessage {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: string;
}

export interface ApiChatListResponse {
    chats: ChatSession[];
}

export interface ApiChatDetailResponse {
    id: string;
    title: string;
    messages: ApiMessage[];
}
