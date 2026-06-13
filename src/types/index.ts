export interface User {
    id: string;
    email: string;
    name: string;
    role: "student" | "parent" | "teacher" | "admin";
    preferredLanguage?: string;
    culturalBackground?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Student extends User {
    grade: number;
    mathLevel: "beginner" | "intermediate" | "advanced";
    learningStyle?: "visual" | "auditory" | "kinesthetic";
    progress: Progress[];
    achievements: Achievement[];
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    role: "user" | "assistant" | "system";
    content: string;
    originalLanguage?: string;
    translatedContent?: string;
    culturalContext?: CulturalContext;
    timestamp: Date;
}

export interface CulturalContext {
    analogies: string[];
    culturalReferences: string[];
    examples: string[];
}

export interface MathProblem {
    id: string;
    question: string;
    answer: string | number;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
    topic: string;
    grade: number;
    culturalVariants?: CulturalVariant[];
}

export interface CulturalVariant {
    culture: string;
    question: string;
    explanation: string;
    examples: string[];
}

export interface Progress {
    id: string;
    studentId: string;
    topic: string;
    completedProblems: number;
    correctAnswers: number;
    timeSpent: number;
    lastActivity: Date;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: Date;
    requirements: string;
}
