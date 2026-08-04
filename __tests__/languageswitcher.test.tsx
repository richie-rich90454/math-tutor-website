// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { LanguageProvider } from "@/contexts/LanguageContext";

function renderSwitcher() {
    return render(
        <LanguageProvider>
            <LanguageSwitcher />
        </LanguageProvider>,
    );
}

describe("LanguageSwitcher", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("renders the current language button", () => {
        renderSwitcher();
        expect(screen.getByRole("button", { name: /Language/i })).toBeInTheDocument();
    });

    it("opens the dropdown and persists the selected language", async () => {
        renderSwitcher();
        fireEvent.click(screen.getByRole("button", { name: /Language/i }));
        expect(await screen.findByRole("listbox")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Español"));

        await waitFor(() => {
            expect(localStorage.getItem("preferred-language")).toBe("es");
        });
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("closes on Escape and restores focus to the trigger", async () => {
        renderSwitcher();
        const btn = screen.getByRole("button", { name: /Language/i });
        fireEvent.click(btn);
        const listbox = await screen.findByRole("listbox");

        fireEvent.keyDown(listbox, { key: "Escape" });

        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        await waitFor(() => expect(btn).toHaveFocus());
    });

    it("moves focus with the arrow keys", async () => {
        renderSwitcher();
        fireEvent.click(screen.getByRole("button", { name: /Language/i }));
        const listbox = await screen.findByRole("listbox");

        fireEvent.keyDown(listbox, { key: "ArrowDown" });

        const active = document.activeElement;
        expect(active).not.toBeNull();
        expect(active?.tagName).toBe("BUTTON");
        expect(active?.textContent).toBeTruthy();

        fireEvent.keyDown(listbox, { key: "ArrowUp" });
        expect(document.activeElement?.textContent).toBeTruthy();
    });

    it("marks the active language option", async () => {
        renderSwitcher();
        fireEvent.click(screen.getByRole("button", { name: /Language/i }));
        const listbox = await screen.findByRole("listbox");
        const activeOption = listbox.querySelector('[aria-selected="true"]');
        expect(activeOption?.textContent).toContain("English");
    });
});
