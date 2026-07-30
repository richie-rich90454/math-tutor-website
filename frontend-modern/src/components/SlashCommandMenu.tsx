interface SlashCommandMenuProps {
    isOpen: boolean;
    onSelect: (command: string) => void;
    onClose: () => void;
    position: { top: number; left: number };
}

export default function SlashCommandMenu(_props: SlashCommandMenuProps) {
    return null;
}
