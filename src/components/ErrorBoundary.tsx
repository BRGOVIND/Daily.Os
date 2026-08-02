"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * App-level error boundary. Without this, a render error anywhere would blank
 * the whole screen. Daily OS is offline-first, so a crash never risks the user's
 * data (it's safe in IndexedDB) — this surface says so and offers a reload.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    // No telemetry by design; log locally so a developer can inspect.
    if (typeof console !== "undefined") console.error("Daily OS crashed:", error);
  }

  private reset = () => this.setState({ error: null });

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-canvas px-6 text-center">
        <div className="max-w-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            Something went wrong
          </p>
          <h1 className="mt-2 font-display text-2xl font-light text-ink">
            Daily OS hit a snag.
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Your data is safe — everything lives on this device. Reloading almost
            always fixes it.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Reload Daily OS
          </button>
          <button
            type="button"
            onClick={this.reset}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}
