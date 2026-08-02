// @vitest-environment jsdom
/**
 * Mounts the real dashboard against an (empty) IndexedDB and asserts that every
 * Phase-9 feature's entry point is actually present in the rendered DOM — the
 * ground-truth answer to "is it reachable from the UI?".
 */
import "fake-indexeddb/auto";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { AppShell } from "./AppShell";
import { ProfileProvider, type ProfileContextValue } from "./profile/ProfileContext";
import { guestProfile } from "@/lib/profiles";

// EntryFlow always wraps AppShell in a ProfileProvider in production; supply an
// equivalent guest context here so TopNav's useProfile() resolves.
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
  Element.prototype.hasPointerCapture = vi.fn(() => false) as never;
  Element.prototype.setPointerCapture = vi.fn() as never;
  Element.prototype.releasePointerCapture = vi.fn() as never;
});

afterEach(() => cleanup());

describe("AppShell (jsdom mount) — feature entry points", () => {
  it("renders the dashboard with every Phase-9 entry point reachable", async () => {
    render(
      createElement(ProfileProvider, { value: profileCtx }, createElement(AppShell)),
    );

    // Wait for the shell to mount past the boot skeleton.
    await waitFor(() => expect(screen.getByLabelText("Add task")).toBeTruthy(), {
      timeout: 4000,
    });

    // Quick Notes / Pomodoro / Focus / Sticky / Routines all live behind the
    // Daily-tools dock trigger.
    expect(screen.getByLabelText("Daily tools")).toBeTruthy();
    // Daily Utilities edge handle.
    expect(screen.getByLabelText("Daily utilities")).toBeTruthy();
    // Calendar Agenda section (renders after its live query resolves).
    expect(await screen.findByLabelText("Agenda", {}, { timeout: 4000 })).toBeTruthy();
    // Top navigation renders its action buttons (Missions is one of them).
    expect(screen.getByLabelText("Missions")).toBeTruthy();
  });
});
