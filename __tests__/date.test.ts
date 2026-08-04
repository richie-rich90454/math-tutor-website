import { describe, it, expect } from "vitest";
import { parseUTCTimestamp } from "@/lib/date";

describe("parseUTCTimestamp", () => {
    it("parses ISO string ending in Z", () => {
        expect(parseUTCTimestamp("2024-01-02T03:04:05Z").toISOString()).toBe("2024-01-02T03:04:05.000Z");
    });

    it("parses ISO string with timezone offset", () => {
        expect(parseUTCTimestamp("2024-01-02T03:04:05+02:00").toISOString()).toBe("2024-01-02T01:04:05.000Z");
        expect(parseUTCTimestamp("2024-01-02T03:04:05-05:00").toISOString()).toBe("2024-01-02T08:04:05.000Z");
    });

    it("parses SQL-style timestamp without zone as UTC", () => {
        expect(parseUTCTimestamp("2024-01-02 03:04:05").toISOString()).toBe("2024-01-02T03:04:05.000Z");
    });

    it("parses a bare date as UTC midnight", () => {
        expect(parseUTCTimestamp("2024-01-02").toISOString()).toBe("2024-01-02T00:00:00.000Z");
    });

    it("returns the current time for an empty string", () => {
        const before = Date.now();
        const d = parseUTCTimestamp("");
        expect(isNaN(d.getTime())).toBe(false);
        expect(d.getTime()).toBeGreaterThanOrEqual(before - 1000);
    });

    it("returns Invalid Date for unparseable input", () => {
        expect(isNaN(parseUTCTimestamp("garbage").getTime())).toBe(true);
    });
});
