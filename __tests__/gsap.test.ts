import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { gsapMock } = vi.hoisted(() => ({
    gsapMock: { registerPlugin: vi.fn(), from: vi.fn(), to: vi.fn() },
}));

vi.mock("gsap", () => ({ default: gsapMock }));
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: {} }));
vi.mock("@gsap/react", () => ({ useGSAP: {} }));

import { springIn, particleBurst } from "@/lib/gsap";

function rect() {
    return { left: 10, top: 20, width: 100, height: 50 } as DOMRect;
}

beforeEach(() => {
    gsapMock.registerPlugin.mockClear();
    gsapMock.from.mockClear();
    gsapMock.to.mockClear();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("springIn", () => {
    it("defaults to bottom origin with elastic ease", () => {
        const el = {} as HTMLElement;
        springIn(el);
        expect(gsapMock.from).toHaveBeenCalledWith(
            el,
            expect.objectContaining({ opacity: 0, y: 20, duration: 0.6, ease: "elastic.out(1, 0.5)" }),
        );
    });

    it("slides from the left", () => {
        springIn({} as HTMLElement, { from: "left" });
        expect(gsapMock.from.mock.calls[0][1].x).toBe(-40);
        expect(gsapMock.from.mock.calls[0][1].y).toBeUndefined();
    });

    it("slides from the right with custom duration and delay", () => {
        springIn({} as HTMLElement, { from: "right", duration: 1.2, delay: 0.3 });
        expect(gsapMock.from.mock.calls[0][1].x).toBe(40);
        expect(gsapMock.from.mock.calls[0][1].duration).toBe(1.2);
        expect(gsapMock.from.mock.calls[0][1].delay).toBe(0.3);
    });
});

describe("particleBurst", () => {
    it("creates one particle per count with cycling colors", () => {
        const created: Array<{ style: Record<string, string>; remove: ReturnType<typeof vi.fn> }> = [];
        const onCompletes: Array<() => void> = [];
        gsapMock.to.mockImplementation((_p: unknown, opts: { onComplete: () => void }) => {
            onCompletes.push(opts.onComplete);
        });
        vi.stubGlobal("document", {
            createElement: () => {
                const p = { style: {}, remove: vi.fn() };
                created.push(p);
                return p;
            },
            body: { appendChild: vi.fn() },
        });

        particleBurst({ getBoundingClientRect: rect } as unknown as HTMLElement, 3);

        expect(created.length).toBe(3);
        expect(gsapMock.to).toHaveBeenCalledTimes(3);
        expect(created[0].style.background).toBe("#60a5fa");
        expect(created[1].style.background).toBe("#a78bfa");
        expect(created[2].style.background).toBe("#f472b6");
        expect(created[0].style.left).toBe("60px");
        expect(created[0].style.top).toBe("45px");

        onCompletes[0]();
        expect(created[0].remove).toHaveBeenCalledTimes(1);
    });

    it("produces no particles when count is zero", () => {
        vi.stubGlobal("document", {
            createElement: () => ({ style: {}, remove: vi.fn() }),
            body: { appendChild: vi.fn() },
        });
        particleBurst({ getBoundingClientRect: rect } as unknown as HTMLElement, 0);
        expect(gsapMock.to).not.toHaveBeenCalled();
    });

    it("re-cycles colors when count exceeds the palette", () => {
        vi.stubGlobal("document", {
            createElement: () => ({ style: {}, remove: vi.fn() }),
            body: { appendChild: vi.fn() },
        });
        particleBurst({ getBoundingClientRect: rect } as unknown as HTMLElement, 5);
        expect(gsapMock.to.mock.calls[0][0].style.background).toBe("#60a5fa");
        expect(gsapMock.to.mock.calls[4][0].style.background).toBe("#60a5fa");
    });
});
