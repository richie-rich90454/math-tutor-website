// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import BilingualToggle from "@/components/chat/BilingualToggle";
import { LanguageProvider } from "@/contexts/LanguageContext";

function renderToggle(message = "What is a derivative?") {
    return render(
        <LanguageProvider>
            <BilingualToggle message={message} />
        </LanguageProvider>,
    );
}

function mockTranslate(translation: string) {
    vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ translation }),
        }),
    );
}

describe("BilingualToggle", () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        localStorage.clear();
    });

    it("renders a translate button (icon) with an accessible label", () => {
        renderToggle();
        expect(screen.getByRole("button", { name: "Show Mandarin" })).toBeInTheDocument();
    });

    it("renders nothing when disabled", () => {
        render(
            <LanguageProvider>
                <BilingualToggle message="x" disabled />
            </LanguageProvider>,
        );
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("fetches a translation on first open and shows it", async () => {
        mockTranslate("什么是导数？");
        renderToggle();
        fireEvent.click(screen.getByRole("button", { name: "Show Mandarin" }));
        await waitFor(() => {
            expect(screen.getByText("什么是导数？")).toBeInTheDocument();
        });
    });

    it("caches the translation for subsequent toggles", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ translation: "导数" }),
        });
        vi.stubGlobal("fetch", fetchMock);
        renderToggle();
        const btn = screen.getByRole("button", { name: "Show Mandarin" });
        fireEvent.click(btn);
        await waitFor(() => screen.getByText("导数"));
        fireEvent.click(btn); // close
        fireEvent.click(btn); // reopen — should NOT refetch
        await waitFor(() => screen.getByText("导数"));
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("toggles the translation box open and closed", async () => {
        mockTranslate("导数");
        renderToggle();
        const btn = screen.getByRole("button", { name: "Show Mandarin" });
        fireEvent.click(btn);
        await waitFor(() => screen.getByText("导数"));
        fireEvent.click(btn);
        expect(screen.queryByText("导数")).not.toBeInTheDocument();
    });
});
