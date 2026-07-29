import type { ComponentChildren } from 'preact';

interface FocusTrapProps {
    children: ComponentChildren;
    isActive: boolean;
    onDeactivate: () => void;
}

export function FocusTrap({ children }: FocusTrapProps) {
    return <>{children}</>;
}
