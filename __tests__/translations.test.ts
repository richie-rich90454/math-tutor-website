import { describe, it, expect } from "vitest";
import { translationLoaders } from "@/lib/translations";
import en from "@/lib/translations/en";

describe("i18n contract", () => {
    const enKeys = Object.keys(en).sort();

    it("the english table is the reference and is non-trivial", () => {
        expect(enKeys.length).toBeGreaterThan(200);
    });

    it("exposes a loader for every language", () => {
        expect(Object.keys(translationLoaders).length).toBe(35);
    });

    it("every language table has exactly the same keys as english", async () => {
        for (const [code, loader] of Object.entries(translationLoaders)) {
            const mod = await loader();
            expect(mod.default, `table for ${code}`).toBeDefined();
            expect(Object.keys(mod.default).sort(), `key set for ${code}`).toEqual(enKeys);
        }
    });

    it("every language value is a non-empty string", async () => {
        for (const [code, loader] of Object.entries(translationLoaders)) {
            const mod = await loader();
            for (const [key, value] of Object.entries(mod.default)) {
                expect(typeof value, `${code}.${key}`).toBe("string");
                expect(value.trim().length, `${code}.${key}`).toBeGreaterThan(0);
            }
        }
    });
});
