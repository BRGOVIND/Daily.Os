// @vitest-environment jsdom
/**
 * Measures the AppShell re-render cascade objectively. Each always-mounted child
 * is replaced with a React.memo'd counting stub, so a stub only re-renders when
 * AppShell passes it a NEW prop reference. We then trigger an unrelated state
 * change (opening the Add-task composer via the FAB) and count which children
 * re-rendered. Stable-prop children should NOT re-render; unstable ones will.
 *
 * This is the measurement behind the memoization fix — run before and after.
 */
import "fake-indexeddb/auto";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";

const h = vi.hoisted(() => {
  const counts: Record<string, number> = {};
  const stub = async (name: string) => {
    const { memo } = await import("react");
    return memo(function Stub() {
      counts[name] = (counts[name] ?? 0) + 1;
      return null;
    });
  };
  return { counts, stub };
});
const counts = { map: h.counts };

// Replace each always-mounted child with a memo'd counting stub. FAB stays real
// so we can click it to trigger an unrelated AppShell state update.
vi.mock("./calendar/Calendar", async () => ({ Calendar: await h.stub("Calendar") }));
vi.mock("./calendar/TodayPreview", async () => ({ TodayPreview: await h.stub("TodayPreview") }));
vi.mock("./calendar/CalendarAgenda", async () => ({ CalendarAgenda: await h.stub("CalendarAgenda") }));
vi.mock("./layout/TopNav", async () => ({ TopNav: await h.stub("TopNav") }));
vi.mock("./layout/QuickDock", async () => ({ QuickDock: await h.stub("QuickDock") }));
vi.mock("./utilities/DailyUtilitiesPanel", async () => ({ DailyUtilitiesPanel: await h.stub("DailyUtilitiesPanel") }));

import { AppShell } from "./AppShell";
import { ProfileProvider, type ProfileContextValue } from "./profile/ProfileContext";
import { guestProfile } from "@/lib/profiles";

const profileCtx: ProfileContextValue = {
  profile: guestProfile(),
  isGuest: true,
  profiles: [],
  switchProfile: () => {},
  continueAsGuest: () => {},
  createProfile: () => {},
  renameProfile: () => {},
  deleteProfile: () => {},
};

beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: false, media: q, onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    }));
  }
  class RO { observe() {} unobserve() {} disconnect() {} }
  window.ResizeObserver = RO as unknown as typeof window.ResizeObserver;
  window.IntersectionObserver = RO as unknown as typeof window.IntersectionObserver;
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false) as never;
  Element.prototype.setPointerCapture = vi.fn() as never;
  Element.prototype.releasePointerCapture = vi.fn() as never;
});

afterEach(() => cleanup());

describe("AppShell re-render cascade (measured)", () => {
  it("counts child re-renders when an unrelated state update fires", async () => {
    render(
      createElement(ProfileProvider, { value: profileCtx }, createElement(AppShell)),
    );
    const fab = await screen.findByLabelText("Add task", {}, { timeout: 4000 });
    // Let initial mount + async live queries settle.
    await waitFor(() => expect(counts.map.Calendar).toBeGreaterThan(0), { timeout: 4000 });

    const before = { ...counts.map };
    // Unrelated state change: open the Add-task composer.
    fireEvent.click(fab);
    await new Promise((r) => setTimeout(r, 50));
    const after = { ...counts.map };

    const delta = (k: string) => (after[k] ?? 0) - (before[k] ?? 0);
    // eslint-disable-next-line no-console
    console.log("RERENDER_DELTAS", JSON.stringify({
      Calendar: delta("Calendar"),
      TodayPreview: delta("TodayPreview"),
      CalendarAgenda: delta("CalendarAgenda"),
      TopNav: delta("TopNav"),
      QuickDock: delta("QuickDock"),
      DailyUtilitiesPanel: delta("DailyUtilitiesPanel"),
    }));

    // With stable props + memo, these must NOT re-render on an unrelated update.
    expect(delta("Calendar")).toBe(0);
    expect(delta("TodayPreview")).toBe(0);
    expect(delta("CalendarAgenda")).toBe(0);
    expect(delta("TopNav")).toBe(0);
    expect(delta("QuickDock")).toBe(0);
    expect(delta("DailyUtilitiesPanel")).toBe(0);
  });
});
