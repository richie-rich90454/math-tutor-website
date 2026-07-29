export interface Message {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

export interface ChatMessageDto {
    role: string;
    content: string;
}
