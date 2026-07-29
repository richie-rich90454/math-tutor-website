import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { Toast } from './components/Toast';
import { Home } from './pages/Home';

export function App() {
    return (
        <LanguageProvider>
            <ToastProvider>
                <Toast />
                <Home />
            </ToastProvider>
        </LanguageProvider>
    );
}
