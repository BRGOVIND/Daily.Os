/**
 * Collaboration — public API (Phase 8).
 *
 * An additive layer that turns Daily OS into a collaborative platform **without
 * a backend and without touching single-user mode**. Everything here is either a
 * pure function or a provider abstraction with a local/offline default, so the
 * app keeps working exactly as before until a real transport/auth provider is
 * wired in. See docs/COLLABORATION.md.
 *
 *   Module 1  Accounts ....... AuthProvider, LocalAuthProvider
 *   Module 2  Roles .......... Role capability matrix, can()
 *   Module 3  Real-time ...... SyncTransport, BroadcastChannelTransport
 *   Module 6  Comments ....... parseMentions, tokenizeComment
 *   Module 7  Activity ....... describeActivity, sortActivity
 *   Module 9  Sync engine .... Lamport clock, resolveConflict, orderMutations
 *   Module 10 Permissions .... can, canAssignRole, assignableRoles
 */

// Identity / accounts
export {
  LocalAuthProvider,
  getAuthProvider,
  setAuthProvider,
  type AuthProvider,
  type Account,
  type AccountKind,
} from "./identity/auth";

// Permissions
export {
  can,
  canAssignRole,
  assignableRoles,
  ROLE_RANK,
  ROLE_LABEL,
  type Capability,
} from "./permissions/permissions";

// Sync
export {
  LocalTransport,
  BroadcastChannelTransport,
  type SyncTransport,
  type SyncStatus,
  type SyncMessage,
} from "./sync/transport";
export {
  tickLamport,
  resolveConflict,
  orderMutations,
  mergeById,
  pending,
  type Versioned,
} from "./sync/queue";

// Activity
export {
  ACTIVITY_VERB,
  ACTIVITY_ICON,
  sortActivity,
  describeActivity,
} from "./activity/activity";

// Comments
export {
  parseMentions,
  tokenizeComment,
  sortComments,
  type CommentToken,
} from "./comments/comments";
