// @vitest-environment jsdom
/**
 * Functional interaction test: mounts the real dashboard and drives the actual
 * entry points a user would click — the ✨ dock, the Pomodoro timer, and the
 * Daily Utilities panel opening a tool — proving the features don't just render
 * but actually open and work.
 */
import "fake-indexeddb/auto";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
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

function renderDashboard() {
  render(
    createElement(ProfileProvider, { value: profileCtx }, createElement(AppShell)),
  );
}

describe("Dashboard interactions (jsdom)", () => {
  it("opens the ✨ dock and reveals every productivity action", async () => {
    renderDashboard();
    const dock = await screen.findByLabelText("Daily tools", {}, { timeout: 4000 });
    fireEvent.click(dock);

    for (const label of [
      "Quick note",
      "Pomodoro",
      "Focus mode",
      "Sticky notes",
      "Routines",
    ]) {
      expect(await screen.findByLabelText(label, {}, { timeout: 3000 })).toBeTruthy();
    }
  });

  it("opens the Pomodoro timer from the dock", async () => {
    renderDashboard();
    fireEvent.click(await screen.findByLabelText("Daily tools", {}, { timeout: 4000 }));
    fireEvent.click(await screen.findByLabelText("Pomodoro", {}, { timeout: 3000 }));

    // The Pomodoro modal (dynamically imported) mounts its phase switcher.
    expect(await screen.findByText("Short break", {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText("Long break")).toBeTruthy();
  });

  it("opens the Daily Utilities panel and launches a tool", async () => {
    renderDashboard();
    fireEvent.click(
      await screen.findByLabelText("Daily utilities", {}, { timeout: 4000 }),
    );

    // Panel reveals the tool grid.
    const shopping = await screen.findByText("Shopping List", {}, { timeout: 3000 });
    fireEvent.click(shopping);

    // The Shopping List tool opens with its input.
    expect(
      await screen.findByPlaceholderText("Add item…", {}, { timeout: 3000 }),
    ).toBeTruthy();
  });
});
