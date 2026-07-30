interface UserAreaProps {
    effectiveIsOpen: boolean;
    isAuthenticated: boolean;
    user: { id: string; email: string; name: string } | null;
    userInitials: string;
    showUserDropdown: boolean;
    setShowUserDropdown: (val: boolean) => void;
    logout: () => Promise<void>;
    onShowShortcuts?: () => void;
}

export default function UserArea({ effectiveIsOpen, userInitials }: UserAreaProps) {
    return (
        <div class="sb-user-area">
            {effectiveIsOpen && (
                <div class="sb-user-info">
                    <span class="sb-user-avatar">{userInitials}</span>
                </div>
            )}
        </div>
    );
}
