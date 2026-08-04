import { describe, it, expect, vi, afterEach } from "vitest";
import { exportChatAsMarkdown, exportChatAsText, downloadFile } from "@/lib/export";

const messages = [
    { role: "user", content: "What is 2+2?", timestamp: "2024-01-02T03:04:05Z" },
    { role: "assistant", content: "4", timestamp: "2024-01-02T03:04:06Z" },
];

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("exportChatAsMarkdown", () => {
    it("includes title, roles, content and separators", () => {
        const md = exportChatAsMarkdown(messages, "Chat Title");
        expect(md.startsWith("# Chat Title")).toBe(true);
        expect(md).toContain("**You**");
        expect(md).toContain("**AI Math Tutor**");
        expect(md).toContain("What is 2+2?");
        expect(md).toContain("---");
    });

    it("handles empty message list", () => {
        const md = exportChatAsMarkdown([], "Empty");
        expect(md).toContain("# Empty");
        expect(md).not.toContain("**You**");
    });

    it("maps unknown roles to the assistant label", () => {
        const md = exportChatAsMarkdown(
            [{ role: "system", content: "x", timestamp: "2024-01-01T00:00:00Z" }],
            "T",
        );
        expect(md).toContain("**AI Math Tutor**");
        expect(md).not.toContain("**You**");
    });
});

describe("exportChatAsText", () => {
    it("includes title, roles, content and dividers", () => {
        const text = exportChatAsText(messages, "Chat Title");
        expect(text.startsWith("Chat Title\n")).toBe(true);
        expect(text).toContain("[You]");
        expect(text).toContain("[AI Math Tutor]");
        expect(text).toContain("=".repeat(50));
        expect(text).toContain("-".repeat(40));
    });

    it("handles empty message list", () => {
        const text = exportChatAsText([], "Empty");
        expect(text).toContain("Empty\n");
        expect(text).not.toContain("[You]");
    });
});

describe("downloadFile", () => {
    it("creates a blob URL, clicks the anchor, and revokes the URL", () => {
        const click = vi.fn();
        const anchor = { href: "", download: "", click };
        const appendChild = vi.fn();
        const removeChild = vi.fn();
        const createObjectURL = vi.fn(() => "blob:mock-url");
        const revokeObjectURL = vi.fn();
        vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
        vi.stubGlobal("document", {
            createElement: vi.fn(() => anchor),
            body: { appendChild, removeChild },
        });

        downloadFile("hello", "file.txt", "text/plain");

        expect(createObjectURL).toHaveBeenCalledTimes(1);
        expect(anchor.href).toBe("blob:mock-url");
        expect(anchor.download).toBe("file.txt");
        expect(appendChild).toHaveBeenCalledWith(anchor);
        expect(click).toHaveBeenCalledTimes(1);
        expect(removeChild).toHaveBeenCalledWith(anchor);
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });
});
