/**
 * Authentication abstraction (Module 1).
 *
 * The UI never talks to an auth vendor directly — it depends only on the
 * `AuthProvider` interface. Daily OS ships a `LocalAuthProvider` that keeps the
 * app fully offline (a per-device guest identity, no network, no account). A
 * real provider — a self-hosted sync server, an OAuth vendor, an org SSO — can
 * implement the same interface later without touching any UI.
 */

import type { Identity } from "@/types";

/** The account tiers the abstraction must support. */
export type AccountKind = "guest" | "personal" | "shared" | "organization";

export interface Account {
  kind: AccountKind;
  actorId: string;
  name: string;
  /** True only when a networked provider has an authenticated session. */
  authenticated: boolean;
}

/**
 * The seam every auth backend implements. Intentionally tiny: identity in,
 * session lifecycle, and a change subscription. No provider specifics leak out.
 */
export interface AuthProvider {
  readonly kind: AccountKind;
  /** The current account, or the local guest when unauthenticated. */
  current(): Promise<Account>;
  signIn?(): Promise<Account>;
  signOut?(): Promise<void>;
  onChange?(cb: (account: Account) => void): () => void;
}

/**
 * The default, always-available provider: a local guest identity. It never
 * touches the network, so single-user/offline mode is unaffected by any of the
 * collaboration machinery.
 */
export class LocalAuthProvider implements AuthProvider {
  readonly kind: AccountKind = "guest";
  constructor(private readonly identity: Identity) {}
  async current(): Promise<Account> {
    return {
      kind: "guest",
      actorId: this.identity.actorId,
      name: this.identity.name,
      authenticated: false,
    };
  }
}

/** The active provider. Swappable at wiring time; defaults to local/offline. */
let provider: AuthProvider | null = null;

export function setAuthProvider(p: AuthProvider): void {
  provider = p;
}

export function getAuthProvider(fallback: Identity): AuthProvider {
  return provider ?? new LocalAuthProvider(fallback);
}
