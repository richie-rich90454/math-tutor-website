'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface MathConcept {
  concept_id: string;
  concept_name: string;
  aliases: string[];
  mongolian_culture?: string;
  tibetan_culture?: string;
  explanation_text: string;
  image_prompt: string;
}

interface ConceptContextType {
  concepts: MathConcept[];
  currentCulture: 'mongolian' | 'tibetan';
  setCulture: (culture: 'mongolian' | 'tibetan') => void;
  getConceptById: (id: string) => MathConcept | undefined;
  searchConcepts: (query: string) => MathConcept[];
  getConceptsByCategory: (category: string) => MathConcept[];
}

const ConceptContext = createContext<ConceptContextType | undefined>(undefined);

async function loadConcepts(culture: 'mongolian' | 'tibetan'): Promise<MathConcept[]> {
  try {
    let importedModule;
    if (culture === 'mongolian') {
      importedModule = await import('./context_json/mongolian_math_concepts_full_70_plus.json');
    } else {
      importedModule = await import('./context_json/tibetan_math_concepts_full_70_plus.json');
    }
    return importedModule.default || importedModule;
  } catch (error) {
    console.error(`Failed to load ${culture} concepts:`, error);
    return [];
  }
}

export function ConceptProvider({ children }: { children: ReactNode }) {
  const [concepts, setConcepts] = useState<MathConcept[]>([]);
  const [currentCulture, setCurrentCulture] = useState<'mongolian' | 'tibetan'>('mongolian');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    loadConcepts(currentCulture)
      .then(data => {
        setConcepts(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Failed to load concepts:', error);
        setIsLoading(false);
      });
  }, [currentCulture]);

  const setCulture = (culture: 'mongolian' | 'tibetan') => {
    setCurrentCulture(culture);
  };

  const getConceptById = (id: string): MathConcept | undefined => {
    return concepts.find(concept => concept.concept_id === id);
  };

  const searchConcepts = (query: string): MathConcept[] => {
    const lowerQuery = query.toLowerCase();
    return concepts.filter(concept => 
      concept.concept_name.toLowerCase().includes(lowerQuery) ||
      concept.aliases.some(alias => alias.toLowerCase().includes(lowerQuery)) ||
      concept.explanation_text.toLowerCase().includes(lowerQuery)
    );
  };

  const getConceptsByCategory = (category: string): MathConcept[] => {
    return concepts.filter(concept => 
      concept.concept_name.toLowerCase().includes(category.toLowerCase()) ||
      concept.aliases.some(alias => alias.toLowerCase().includes(category.toLowerCase()))
    );
  };

  return (
    <ConceptContext.Provider value={{
      concepts,
      currentCulture,
      setCulture,
      getConceptById,
      searchConcepts,
      getConceptsByCategory
    }}>
      {children}
    </ConceptContext.Provider>
  );
}

export function useConcepts() {
  const context = useContext(ConceptContext);
  if (context === undefined) {
    throw new Error('useConcepts must be used within a ConceptProvider');
  }
  return context;
}
