"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Culture =
    | "mongolian"
    | "tibetan"
    | "english"
    | "chinese"
    | "spanish"
    | "french"
    | "german"
    | "japanese"
    | "arabic"
    | "hebrew"
    | "kazakh"
    | "uyghur"
    | "korean"
    | "zhuang";

export interface MathConcept {
    concept_id: string;
    concept_name: string;
    aliases: string[];
    mongolian_culture?: string;
    tibetan_culture?: string;
    english_culture?: string;
    chinese_culture?: string;
    spanish_culture?: string;
    french_culture?: string;
    german_culture?: string;
    japanese_culture?: string;
    arabic_culture?: string;
    hebrew_culture?: string;
    kazakh_culture?: string;
    uyghur_culture?: string;
    korean_culture?: string;
    zhuang_culture?: string;
    explanation_text: string;
    image_prompt: string;
}

interface ConceptContextType {
    concepts: MathConcept[];
    currentCulture: Culture;
    setCulture: (culture: Culture) => void;
    getConceptById: (id: string) => MathConcept | undefined;
    searchConcepts: (query: string) => MathConcept[];
    getConceptsByCategory: (category: string) => MathConcept[];
}

const ConceptContext = createContext<ConceptContextType | undefined>(undefined);

const cultureModules: Record<Culture, () => Promise<{ default?: MathConcept[] }>> = {
    mongolian: () => import("./context_json/mongolian_math_concepts_full_70_plus.json"),
    tibetan: () => import("./context_json/tibetan_math_concepts_full_70_plus.json"),
    english: () => import("./context_json/english_math_concepts_full_70_plus.json"),
    chinese: () => import("./context_json/chinese_math_concepts_full_70_plus.json"),
    spanish: () => import("./context_json/spanish_math_concepts_full_70_plus.json"),
    french: () => import("./context_json/french_math_concepts_full_70_plus.json"),
    german: () => import("./context_json/german_math_concepts_full_70_plus.json"),
    japanese: () => import("./context_json/japanese_math_concepts_full_70_plus.json"),
    arabic: () => import("./context_json/arabic_math_concepts_full_70_plus.json"),
    hebrew: () => import("./context_json/hebrew_math_concepts_full_70_plus.json"),
    kazakh: () => import("./context_json/kazakh_math_concepts_full_70_plus.json"),
    uyghur: () => import("./context_json/uyghur_math_concepts_full_70_plus.json"),
    korean: () => import("./context_json/korean_math_concepts_full_70_plus.json"),
    zhuang: () => import("./context_json/zhuang_math_concepts_full_70_plus.json"),
};

async function loadConcepts(culture: Culture): Promise<MathConcept[]> {
    try {
        const importedModule = await cultureModules[culture]();
        return (importedModule.default ?? importedModule) as MathConcept[];
    } catch (error) {
        console.error(`Failed to load ${culture} concepts:`, error);
        return [];
    }
}

export function ConceptProvider({ children }: { children: ReactNode }) {
    const [concepts, setConcepts] = useState<MathConcept[]>([]);
    const [currentCulture, setCurrentCulture] = useState<Culture>("mongolian");
    const [, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        loadConcepts(currentCulture)
            .then((data) => {
                setConcepts(data);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error("Failed to load concepts:", error);
                setIsLoading(false);
            });
    }, [currentCulture]);

    const setCulture = (culture: Culture) => {
        setCurrentCulture(culture);
    };

    const getConceptById = (id: string): MathConcept | undefined => {
        return concepts.find((concept) => concept.concept_id === id);
    };

    const searchConcepts = (query: string): MathConcept[] => {
        const lowerQuery = query.toLowerCase();
        return concepts.filter(
            (concept) =>
                concept.concept_name.toLowerCase().includes(lowerQuery) ||
                concept.aliases.some((alias) => alias.toLowerCase().includes(lowerQuery)) ||
                concept.explanation_text.toLowerCase().includes(lowerQuery),
        );
    };

    const getConceptsByCategory = (category: string): MathConcept[] => {
        return concepts.filter(
            (concept) =>
                concept.concept_name.toLowerCase().includes(category.toLowerCase()) ||
                concept.aliases.some((alias) =>
                    alias.toLowerCase().includes(category.toLowerCase()),
                ),
        );
    };

    return (
        <ConceptContext.Provider
            value={{
                concepts,
                currentCulture,
                setCulture,
                getConceptById,
                searchConcepts,
                getConceptsByCategory,
            }}
        >
            {children}
        </ConceptContext.Provider>
    );
}

export function useConcepts() {
    const context = useContext(ConceptContext);
    if (context === undefined) {
        throw new Error("useConcepts must be used within a ConceptProvider");
    }
    return context;
}
