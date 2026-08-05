// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import CodeBlock from "@/components/ui/CodeBlock";
import { LanguageProvider } from "@/contexts/LanguageContext";

function renderBlock(language = "python", code = "x = 1") {
    return render(
        <LanguageProvider>
            <CodeBlock language={language} code={code} />
        </LanguageProvider>,
    );
}

describe("CodeBlock", () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        localStorage.clear();
    });

    it("renders the language label", () => {
        renderBlock("python");
        expect(screen.getByText("python")).toBeInTheDocument();
    });

    it("renders a localized copy button", () => {
        renderBlock();
        expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    });

    it("shows Copied after clicking copy", () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, { clipboard: { writeText } });
        renderBlock();
        fireEvent.click(screen.getByRole("button", { name: "Copy" }));
        expect(writeText).toHaveBeenCalledWith("x = 1");
        expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    });

    it("supports different languages", () => {
        renderBlock("typescript", "const a: number = 1;");
        expect(screen.getByText("typescript")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    });
});
