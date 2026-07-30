import type { ChatSession } from '../types/chat';

interface ChatListProps {
    chatHistory: ChatSession[];
    filteredChats: ChatSession[];
    isHistoryLoading: boolean;
    searchQuery: string;
    effectiveIsOpen: boolean;
    showHistoryTooltip: boolean;
    setShowHistoryTooltip: (val: boolean) => void;
    pinned: ChatSession[];
    chatGroups: { [key: string]: ChatSession[] };
    hoveredChatId: string | null;
    setHoveredChatId: (id: string | null) => void;
    currentChat: ChatSession | null;
    handleChatSelect: (chat: ChatSession) => void;
    handleDeleteChat: (chatId: string, chatTitle: string) => void;
    handleContextMenu: (e: MouseEvent, chatId: string) => void;
}

export default function ChatList(_props: ChatListProps) {
    return (
        <div class="sb-chat-list">
            <div class="sb-chat-items" />
        </div>
    );
}
