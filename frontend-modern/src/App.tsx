import { useEffect } from 'preact/hooks';
import { Route, Switch } from 'wouter';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ConceptProvider } from './contexts/ConceptContext';
import { Toast } from './components/Toast';
import { Home } from './pages/Home';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

function HtmlAttributes() {
    const { currentLanguage } = useLanguage();
    useEffect(() => {
        document.documentElement.setAttribute('lang', currentLanguage.code);
        const dir = ['ar', 'he'].includes(currentLanguage.code) ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('dir', dir);
    }, [currentLanguage.code]);
    return null;
}

export function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <LanguageProvider>
                    <HtmlAttributes />
                    <ConceptProvider>
                        <ChatProvider>
                            <Toast />
                            <Switch>
                                <Route path="/login"><LoginPage /></Route>
                                <Route path="/signup"><SignupPage /></Route>
                                <Route path="/*"><Home /></Route>
                            </Switch>
                        </ChatProvider>
                    </ConceptProvider>
                </LanguageProvider>
            </AuthProvider>
        </ToastProvider>
    );
}
