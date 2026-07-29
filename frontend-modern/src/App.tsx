import { Route, Switch } from 'wouter';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toast } from './components/Toast';
import { Home } from './pages/Home';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

export function App() {
    return (
        <LanguageProvider>
            <ToastProvider>
                <AuthProvider>
                    <Toast />
                    <Switch>
                        <Route path="/login"><LoginPage /></Route>
                        <Route path="/signup"><SignupPage /></Route>
                        <Route path="/*"><Home /></Route>
                    </Switch>
                </AuthProvider>
            </ToastProvider>
        </LanguageProvider>
    );
}
