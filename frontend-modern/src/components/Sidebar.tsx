import type { ChatSession } from '../types/chat';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    onChatSelect?: (chat: ChatSession) => void;
    onShowShortcuts?: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
    return (
        <aside class={`sidebar ${isOpen ? 'is-open' : 'is-collapsed'}`}>
            <div class="sb-header">
                <button class="sb-toggle-btn" onClick={onToggle} aria-label="Toggle sidebar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                {isOpen && <span class="sb-title">Chats</span>}
            </div>
            <div class="sb-content">
                <p class="sb-empty">{isOpen ? 'No chats yet' : ''}</p>
            </div>
        </aside>
    );
}
