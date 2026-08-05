// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import VirtualizedMessages from "@/components/chat/VirtualizedMessages";

// jsdom lacks ResizeObserver; the component relies on it for measurement.
beforeAll(() => {
    if (!window.ResizeObserver) {
        window.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        } as unknown as typeof ResizeObserver;
    }
});

function makeChildren(n: number) {
    return Array.from({ length: n }, (_, i) => <span key={i}>{`msg-${i}`}</span>);
}

describe("VirtualizedMessages", () => {
    it("renders all children when count is at or below the threshold", () => {
        const { container } = render(
            <VirtualizedMessages>{makeChildren(50)}</VirtualizedMessages>,
        );
        expect(container.querySelectorAll("span").length).toBe(50);
        expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    it("virtualizes (spacers + measurement wrappers) once above the threshold", () => {
        const { container } = render(
            <VirtualizedMessages>{makeChildren(200)}</VirtualizedMessages>,
        );
        // Spacers mark the off-screen top/bottom; only a window of rows render.
        expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
        expect(container.querySelectorAll("span").length).toBeLessThan(200);
    });

    it("handles an empty child list", () => {
        const { container } = render(<VirtualizedMessages>{[]}</VirtualizedMessages>);
        expect(container.querySelectorAll("span").length).toBe(0);
    });

    it("passes children through unchanged below the threshold", () => {
        const { container } = render(
            <VirtualizedMessages>{makeChildren(3)}</VirtualizedMessages>,
        );
        expect(container.textContent).toContain("msg-0");
        expect(container.textContent).toContain("msg-2");
    });
});
