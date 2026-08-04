import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { APP_VERSION, APP_NAME } from "@/lib/config";

const pkg = JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf8"));

describe("config", () => {
    it("exposes the app name", () => {
        expect(APP_NAME).toBe("MathTutor AI");
    });

    it("version matches package.json", () => {
        expect(APP_VERSION).toBe(pkg.version);
        expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
});
