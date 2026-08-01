import { EntryFlow } from "@/components/entry/EntryFlow";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/**
 * Daily OS opens into a premium entry experience (onboarding / profile picker /
 * hero) that then unfolds into the workspace. The calendar remains the home of
 * the app itself — see AppShell. An error boundary guards the whole tree so a
 * render fault degrades gracefully instead of blanking the screen.
 */
export default function HomePage() {
  return (
    <ErrorBoundary>
      <EntryFlow />
    </ErrorBoundary>
  );
}
