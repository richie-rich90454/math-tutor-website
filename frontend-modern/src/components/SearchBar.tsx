interface SearchBarProps {
    effectiveIsOpen: boolean;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    handleNewChat: () => void;
}

export default function SearchBar({ effectiveIsOpen, searchQuery, setSearchQuery, handleNewChat }: SearchBarProps) {
    return (
        <div class="sb-search">
            {effectiveIsOpen && (
                <>
                    <input
                        type="text"
                        class="sb-search-input"
                        value={searchQuery}
                        onInput={(e) => setSearchQuery(e.currentTarget.value)}
                        placeholder="Search..."
                    />
                    <button class="sb-new-chat-btn" onClick={handleNewChat}>+</button>
                </>
            )}
        </div>
    );
}
