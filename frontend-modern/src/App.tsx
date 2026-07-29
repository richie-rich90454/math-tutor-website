import { LanguageProvider } from './contexts/LanguageContext';
import { Home } from './pages/Home';

export function App() {
    return (
        <LanguageProvider>
            <Home />
        </LanguageProvider>
    );
}
