import { createContext, useContext } from 'preact/compat';
import type { ComponentChildren } from 'preact';

interface ConceptContextType {
    getConcept: (topic: string) => string | null;
}

const ConceptContext = createContext<ConceptContextType>({ getConcept: () => null });

export function ConceptProvider({ children }: { children: ComponentChildren }) {
    return (
        <ConceptContext.Provider value={{ getConcept: () => null }}>
            {children}
        </ConceptContext.Provider>
    );
}

export function useConcept() {
    return useContext(ConceptContext);
}
