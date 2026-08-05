// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import MarkdownRenderer, { extractSuggestions } from "@/components/ui/MarkdownRenderer";
import { LanguageProvider } from "@/contexts/LanguageContext";

function renderMarkdown(content: string, onSuggestionClick?: (t: string) => void) {
    return render(
        <LanguageProvider>
            <MarkdownRenderer content={content} onSuggestionClick={onSuggestionClick} />
        </LanguageProvider>,
    );
}

describe("MarkdownRenderer", () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        localStorage.clear();
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ sheets: [] }) }),
        );
    });

    it("renders nothing for empty content", () => {
        const { container } = renderMarkdown("");
        expect(container.textContent).toBe("");
    });

    it("renders plain text", () => {
        renderMarkdown("hello world");
        expect(screen.getByText("hello world")).toBeInTheDocument();
    });

    it("renders markdown bold", async () => {
        renderMarkdown("**important**");
        await waitFor(() => {
            expect(screen.getByText("important")).toBeInTheDocument();
        });
        expect(screen.getByText("important").tagName).toBe("STRONG");
    });

    it("renders inline LaTeX via KaTeX", async () => {
        renderMarkdown("Solve $x^2 + 1 = 0$");
        await waitFor(() => {
            expect(document.querySelector(".katex")).toBeInTheDocument();
        });
    });

    it("renders display LaTeX", async () => {
        renderMarkdown("$$\n\\frac{1}{2}\n$$");
        await waitFor(() => {
            expect(
                document.querySelector(".katex-display") || document.querySelector(".katex"),
            ).toBeTruthy();
        });
    });

    it("renders lists", async () => {
        renderMarkdown("- one\n- two");
        await waitFor(() => {
            expect(screen.getByText("one")).toBeInTheDocument();
            expect(screen.getByText("two")).toBeInTheDocument();
        });
    });

    it("renders suggestion chips and strips the markers", async () => {
        renderMarkdown("Answer here\n[SUGGESTION: Try algebra]\n[SUGGESTION: Draw a graph]", vi.fn());
        await waitFor(() => {
            expect(screen.getByText("Try algebra")).toBeInTheDocument();
            expect(screen.getByText("Draw a graph")).toBeInTheDocument();
        });
        expect(screen.getByText(/Answer here/)).toBeInTheDocument();
    });
});

describe("extractSuggestions", () => {
    it("extracts multiple suggestions and cleans content", () => {
        const { suggestions, cleanContent } = extractSuggestions(
            "Hi\n[SUGGESTION: one]\n[SUGGESTION: two]",
        );
        expect(suggestions).toEqual(["one", "two"]);
        expect(cleanContent).toContain("Hi");
        expect(cleanContent).not.toContain("SUGGESTION");
    });

    it("returns no suggestions when none present", () => {
        const { suggestions, cleanContent } = extractSuggestions("plain text");
        expect(suggestions).toEqual([]);
        expect(cleanContent).toBe("plain text");
    });

    it("trims suggestion whitespace", () => {
        const { suggestions } = extractSuggestions("[SUGGESTION:  spaced  ]");
        expect(suggestions).toEqual(["spaced"]);
    });
});
