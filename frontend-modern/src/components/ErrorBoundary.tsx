import { Component } from 'preact/compat';
import type { ComponentChildren } from 'preact';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
    children: ComponentChildren;
    fallback?: ComponentChildren;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
    const { t } = useLanguage();
    return (
        <div class="error-boundary">
            <div class="error-boundary-card">
                <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    class="error-boundary-icon"
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h2 class="error-boundary-title">{t("errorBoundaryTitle")}</h2>
                <p class="error-boundary-message">
                    {error?.message || t("errorBoundaryMessage")}
                </p>
                <div class="error-boundary-actions">
                    <button onClick={onReset} class="error-boundary-btn">
                        {t("errorBoundaryTryAgain")}
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        class="error-boundary-btn error-boundary-btn-secondary"
                    >
                        {t("errorBoundaryReload")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <ErrorFallback
                    error={this.state.error}
                    onReset={() => this.setState({ hasError: false, error: null })}
                />
            );
        }
        return this.props.children;
    }
}
