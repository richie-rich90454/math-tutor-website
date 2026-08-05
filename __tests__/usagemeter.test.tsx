// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import UsageMeter from "@/components/ui/UsageMeter";
import { LanguageProvider } from "@/contexts/LanguageContext";

function renderMeter() {
    return render(
        <LanguageProvider>
            <UsageMeter />
        </LanguageProvider>,
    );
}

function mockFetch(payload: unknown) {
    vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(payload),
        }),
    );
}

describe("UsageMeter", () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        localStorage.clear();
    });

    it("renders token and cost with thousands formatting", async () => {
        mockFetch({
            today: { requestTokens: 1500, responseTokens: 500, total: 2000, estCostUsd: 0.0123 },
        });
        renderMeter();
        await waitFor(() => {
            expect(screen.getByText(/2\.0k tok/)).toBeInTheDocument();
        });
    });

    it("shows cache hits when present", async () => {
        mockFetch({
            today: { requestTokens: 0, responseTokens: 0, total: 100, estCostUsd: 0 },
            cacheHits: 3,
        });
        renderMeter();
        await waitFor(() => {
            expect(screen.getByText(/3/)).toBeInTheDocument();
        });
    });

    it("renders nothing when usage has no today", async () => {
        mockFetch({});
        renderMeter();
        await waitFor(() => {
            expect(screen.queryByText(/tok/)).not.toBeInTheDocument();
        });
    });
});
