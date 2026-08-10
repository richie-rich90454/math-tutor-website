// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import BrowserSupportBanner from "@/components/ui/BrowserSupportBanner";
import { LanguageProvider } from "@/contexts/LanguageContext";

function renderBanner() {
    return render(
        <LanguageProvider>
            <BrowserSupportBanner />
        </LanguageProvider>,
    );
}

// jsdom lacks several modern APIs; provide working stubs so the "healthy"
// path renders, and delete a specific one to simulate an outdated browser.
function stubModernApis() {
    if (!window.ResizeObserver) {
        window.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        } as unknown as typeof ResizeObserver;
    }
    if (!window.AbortController) {
        window.AbortController = class {
            abort() {}
        } as unknown as typeof AbortController;
    }
    if (!window.matchMedia) {
        window.matchMedia = (() => ({
            matches: false,
            addEventListener() {},
            removeEventListener() {},
        })) as unknown as typeof window.matchMedia;
    }
    if (!window.fetch) {
        window.fetch = (() => Promise.resolve()) as unknown as typeof fetch;
    }
}

describe("BrowserSupportBanner", () => {
    beforeEach(() => {
        localStorage.clear();
        stubModernApis();
    });
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("renders nothing when all modern APIs are present", () => {
        renderBanner();
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("shows the banner when ResizeObserver is missing", () => {
        // @ts-expect-error intentional removal
        delete window.ResizeObserver;
        renderBanner();
        const banner = screen.getByRole("status");
        expect(banner).toBeInTheDocument();
        expect(banner).toHaveTextContent("support");
    });

    it("links to the legacy site", () => {
        // @ts-expect-error intentional removal
        delete window.ResizeObserver;
        renderBanner();
        const link = screen.getByRole("link", { name: /legacy version/i });
        expect(link).toHaveAttribute("href", "/legacy");
    });

    it("shows the banner when fetch is missing", () => {
        // @ts-expect-error intentional removal
        delete window.fetch;
        renderBanner();
        expect(screen.getByRole("status")).toBeInTheDocument();
    });
});
