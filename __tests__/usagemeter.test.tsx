// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import UsageMeter from "@/components/ui/UsageMeter";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthContext } from "@/contexts/AuthContext";

const authValue = {
    user: {
        id: "1",
        email: "a@b.c",
        name: "T",
        preferred_language: "en",
        math_level: "1",
    },
    isLoading: false,
    isAuthenticated: true,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    startGuest: vi.fn(),
};

function renderMeter() {
    return render(
        <LanguageProvider>
            <AuthContext.Provider value={authValue}>
                <UsageMeter />
            </AuthContext.Provider>
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
