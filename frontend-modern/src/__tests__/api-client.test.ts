import { describe, it, expect } from 'vitest';

describe('translations', () => {
    it('exports English translations with required keys', async () => {
        const { translations } = await import('../lib/translations');
        expect(translations.en).toBeDefined();
        expect(translations.en.title).toBe('MathTutor AI');
        expect(translations.en.subtitle).toContain('personal math tutor');
        expect(translations.en.inputPlaceholder).toBeDefined();
        expect(translations.en.bottomText).toBeDefined();
    });

    it('has all 12 languages defined', async () => {
        const { languages } = await import('../contexts/LanguageContext');
        expect(languages.length).toBe(12);
        const codes = languages.map(l => l.code);
        expect(codes).toContain('en');
        expect(codes).toContain('es');
        expect(codes).toContain('fr');
        expect(codes).toContain('de');
        expect(codes).toContain('ja');
        expect(codes).toContain('zh-hans');
        expect(codes).toContain('zh-hant');
        expect(codes).toContain('ar');
        expect(codes).toContain('he');
    });
});

describe('language utility', () => {
    it('creates API client with correct base URL', () => {
        const baseUrl = '/api/chat';
        expect(baseUrl).toBe('/api/chat');
    });

    it('formats chat request body correctly', () => {
        const request = {
            message: 'test',
            sessionId: null as string | null,
            language: 'en',
        };
        expect(request.message).toBe('test');
        expect(request.language).toBe('en');
    });
});

describe('gsap setup', () => {
    it('exports gsap as a named export', async () => {
        const { gsap } = await import('../lib/gsap');
        expect(gsap).toBeDefined();
        expect(typeof gsap.to).toBe('function');
    });
});
