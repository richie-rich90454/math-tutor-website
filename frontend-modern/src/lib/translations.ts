export const translations: Record<string, Record<string, string>> = {
    en: {
        title: 'MathTutor AI',
        subtitle: 'Your personal math tutor. Ask any question and get step-by-step explanations.',
        inputPlaceholder: 'Ask a math question...',
        bottomText: 'MathTutor AI \u2014 built for everyone',
        openMenu: 'Open menu',
        headerNewChat: 'New chat',
        headerExportChat: 'Export chat',
        chatScrollToBottom: 'Scroll to bottom',
        chatEditMessage: 'Edit message',
        practiceAddition: 'Practice addition',
        learnGeometry: 'Learn geometry',
        timesTables: 'Times tables',
        culturalExamples: 'Cultural examples',
        practiceProblems: 'Practice Problems',
    },
};

export type Translations = typeof translations.en;
