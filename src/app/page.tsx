import { EntryFlow } from "@/components/entry/EntryFlow";

/**
 * Daily OS opens into a premium entry experience (onboarding / profile picker /
 * hero) that then unfolds into the workspace. The calendar remains the home of
 * the app itself — see AppShell.
 */
export default function HomePage() {
  return <EntryFlow />;
}
