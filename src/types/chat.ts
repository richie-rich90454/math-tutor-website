export interface Message {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
    isPinned?: boolean;
    isCached?: boolean;
}
