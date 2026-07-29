import gsap from 'gsap';
import { useEffect, useRef } from 'preact/hooks';

export { gsap };

export interface UseGSAPOptions {
    dependencies?: unknown[];
    scope?: Element | Element[] | NodeList | null;
    revertOnUpdate?: boolean;
}

export function useGSAP(callback: () => void | (() => void), options?: UseGSAPOptions) {
    const cleanupRef = useRef<() => void>();
    const deps = options?.dependencies ?? [];

    useEffect(() => {
        const cleanup = callback();
        cleanupRef.current = typeof cleanup === 'function' ? cleanup : undefined;
        return () => {
            if (cleanupRef.current) cleanupRef.current();
        };
    }, deps);
}
