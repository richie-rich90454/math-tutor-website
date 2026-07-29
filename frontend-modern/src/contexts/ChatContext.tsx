import { createContext, useContext, useState } from 'preact/compat';
import type { ComponentChildren } from 'preact';
import type { ChatSession } from '../types/chat';

interface ChatContextType {
    currentChat: ChatSession | null;
    setCurrentChat: (session: ChatSession | null) => void;
}

const ChatContext = createContext<ChatContextType>(null!);

export function ChatProvider({ children }: { children: ComponentChildren }) {
    const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);

    return (
        <ChatContext.Provider value={{ currentChat, setCurrentChat }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    return useContext(ChatContext);
}
