// @vitest-environment jsdom
/**
 * Real DOM mount of StatsModal against an (empty) IndexedDB — the fresh-user
 * path. Exercises effects, the Radix portal and the Intelligence panel that a
 * static render can't reach. This is the kind of test that would have caught a
 * runtime crash the production build (which only prerenders the skeleton) misses.
 */
import "fake-indexeddb/auto";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { StatsModal } from "./StatsModal";

beforeAll(() => {
  // Shims for browser APIs framer-motion / Radix expect but jsdom lacks.
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = RO as unknown as typeof window.ResizeObserver;
  window.IntersectionObserver =
    RO as unknown as typeof window.IntersectionObserver;
  Element.prototype.scrollIntoView = vi.fn();
  // Radix pointer-capture calls, absent in jsdom.
  Element.prototype.hasPointerCapture = vi.fn(() => false) as never;
  Element.prototype.setPointerCapture = vi.fn() as never;
  Element.prototype.releasePointerCapture = vi.fn() as never;
});

afterEach(() => cleanup());

describe("StatsModal (jsdom mount)", () => {
  it("opens and renders content on an empty database without crashing", async () => {
    render(
      createElement(StatsModal, {
        open: true,
        today: new Date("2026-03-15T12:00:00"),
        onOpenChange: () => {},
        onSelectDay: () => {},
      }),
    );

    // The header renders immediately (portal content). Then the async stats
    // resolve and the charts mount — wait for a chart that only appears with
    // computed stats.
    await waitFor(
      () => {
        expect(screen.getByText("Productivity trend")).toBeTruthy();
      },
      { timeout: 4000 },
    );

    // Heatmap + year-in-review sections should also be present.
    expect(screen.getByText("Your months")).toBeTruthy();
  });
});
