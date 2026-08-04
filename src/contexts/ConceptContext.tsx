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
    | "zhuang"
    | "russian"
    | "yi"
    | "tajik"
    | "jing"
    | "uzbek"
    | "kyrgyz"
    | "miao"
    | "dong"
    | "bai"
    | "dai"
    | "naxi"
    | "tujia"
    | "buyi"
    | "hani"
    | "hlai"
    | "yao"
    | "lisu"
    | "lahu"
    | "wa";

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
    russian_culture?: string;
    yi_culture?: string;
    tajik_culture?: string;
    jing_culture?: string;
    uzbek_culture?: string;
    kyrgyz_culture?: string;
    miao_culture?: string;
    dong_culture?: string;
    bai_culture?: string;
    dai_culture?: string;
    naxi_culture?: string;
    tujia_culture?: string;
    buyi_culture?: string;
    hani_culture?: string;
    hlai_culture?: string;
    yao_culture?: string;
    lisu_culture?: string;
    lahu_culture?: string;
    wa_culture?: string;
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
    mongolian: () => import("./context_json_min/mongolian_math_concepts_full_70_plus.json"),
    tibetan: () => import("./context_json_min/tibetan_math_concepts_full_70_plus.json"),
    english: () => import("./context_json_min/english_math_concepts_full_70_plus.json"),
    chinese: () => import("./context_json_min/chinese_math_concepts_full_70_plus.json"),
    spanish: () => import("./context_json_min/spanish_math_concepts_full_70_plus.json"),
    french: () => import("./context_json_min/french_math_concepts_full_70_plus.json"),
    german: () => import("./context_json_min/german_math_concepts_full_70_plus.json"),
    japanese: () => import("./context_json_min/japanese_math_concepts_full_70_plus.json"),
    arabic: () => import("./context_json_min/arabic_math_concepts_full_70_plus.json"),
    hebrew: () => import("./context_json_min/hebrew_math_concepts_full_70_plus.json"),
    kazakh: () => import("./context_json_min/kazakh_math_concepts_full_70_plus.json"),
    uyghur: () => import("./context_json_min/uyghur_math_concepts_full_70_plus.json"),
    korean: () => import("./context_json_min/korean_math_concepts_full_70_plus.json"),
    zhuang: () => import("./context_json_min/zhuang_math_concepts_full_70_plus.json"),
    russian: () => import("./context_json_min/russian_math_concepts_full_70_plus.json"),
    yi: () => import("./context_json_min/yi_math_concepts_full_70_plus.json"),
    tajik: () => import("./context_json_min/tajik_math_concepts_full_70_plus.json"),
    jing: () => import("./context_json_min/jing_math_concepts_full_70_plus.json"),
    uzbek: () => import("./context_json_min/uzbek_math_concepts_full_70_plus.json"),
    kyrgyz: () => import("./context_json_min/kyrgyz_math_concepts_full_70_plus.json"),
    miao: () => import("./context_json_min/miao_math_concepts_full_70_plus.json"),
    dong: () => import("./context_json_min/dong_math_concepts_full_70_plus.json"),
    bai: () => import("./context_json_min/bai_math_concepts_full_70_plus.json"),
    dai: () => import("./context_json_min/dai_math_concepts_full_70_plus.json"),
    naxi: () => import("./context_json_min/naxi_math_concepts_full_70_plus.json"),
    tujia: () => import("./context_json_min/tujia_math_concepts_full_70_plus.json"),
    buyi: () => import("./context_json_min/buyi_math_concepts_full_70_plus.json"),
    hani: () => import("./context_json_min/hani_math_concepts_full_70_plus.json"),
    hlai: () => import("./context_json_min/hlai_math_concepts_full_70_plus.json"),
    yao: () => import("./context_json_min/yao_math_concepts_full_70_plus.json"),
    lisu: () => import("./context_json_min/lisu_math_concepts_full_70_plus.json"),
    lahu: () => import("./context_json_min/lahu_math_concepts_full_70_plus.json"),
    wa: () => import("./context_json_min/wa_math_concepts_full_70_plus.json"),
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
