// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ContinueLearning from "@/components/home/ContinueLearning";
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

function mockFetchWith(...responses: Array<{ topics?: unknown[]; weakTopics?: unknown[] }>) {
    const calls: Array<() => Promise<unknown>> = responses.map((body) => () =>
        Promise.resolve({ ok: true, json: () => Promise.resolve(body) }),
    );
    vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(() => {
            const next = calls.shift();
            return next ? next() : Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
        }),
    );
}

function renderLearning() {
    return render(
        <LanguageProvider>
            <AuthContext.Provider value={authValue}>
                <ContinueLearning onSelect={vi.fn()} />
            </AuthContext.Provider>
        </LanguageProvider>,
    );
}

describe("ContinueLearning", () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        localStorage.clear();
    });

    it("renders recent topic chips from the progress endpoint", async () => {
        mockFetchWith(
            { topics: [{ topic: "Algebra" }, { topic: "Geometry" }, { topic: "  " }] },
            { weakTopics: [] },
        );
        renderLearning();
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Algebra" })).toBeInTheDocument();
        });
        expect(screen.getByRole("button", { name: "Geometry" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "  " })).not.toBeInTheDocument();
    });

    it("renders weak topic chips and calls onSelect with the topic", async () => {
        mockFetchWith(
            { topics: [] },
            { weakTopics: [{ topic: "Fractions" }] },
        );
        const onSelect = vi.fn();
        render(
            <LanguageProvider>
                <AuthContext.Provider value={authValue}>
                    <ContinueLearning onSelect={onSelect} />
                </AuthContext.Provider>
            </LanguageProvider>,
        );
        await waitFor(() => {
            const chip = screen.getByRole("button", { name: "Fractions" });
            fireEvent.click(chip);
        });
        expect(onSelect).toHaveBeenCalledWith("Fractions");
    });

    it("renders nothing when there are no topics", async () => {
        mockFetchWith({ topics: [] }, { weakTopics: [] });
        renderLearning();
        await waitFor(() => {
            expect(screen.queryByRole("button")).not.toBeInTheDocument();
        });
    });
});
