import { describe, it, expect } from "vitest";
import { APP_VERSION, APP_NAME } from "@/lib/config";
import pkg from "../../package.json";

describe("config", () => {
    it("exposes the app name", () => {
        expect(APP_NAME).toBe("MathTutor AI");
    });

    it("version matches package.json", () => {
        expect(APP_VERSION).toBe(pkg.version);
        expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
});
