import { useState, useRef, useEffect } from 'preact/hooks';
import { useLanguage, languages } from '../contexts/LanguageContext';

export function LanguageSwitcher() {
    const { currentLanguage, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: Event) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div class="lang-switcher" ref={ref}>
            <button class="lang-switcher-btn" onClick={() => setIsOpen(v => !v)} aria-label="Switch language">
                <span class="lang-switcher-label">{currentLanguage.code.toUpperCase()}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style={{ transform: isOpen ? 'rotate(180deg)' : '' }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
            {isOpen && (
                <div class="lang-switcher-dropdown">
                    {languages.map(lang => (
                        <button
                            key={lang.code}
                            class={`lang-switcher-option ${lang.code === currentLanguage.code ? 'is-active' : ''}`}
                            onClick={() => { setLanguage(lang); setIsOpen(false); }}
                        >
                            {lang.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
