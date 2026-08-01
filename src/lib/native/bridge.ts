/**
 * The low-level bridge to the Tauri native shell.
 *
 * Deliberately **dependency-free**: it talks to the shell through the
 * `window.__TAURI__` global that Tauri injects when `withGlobalTauri` is on
 * (see `src-tauri/tauri.conf.json`). That means the web build imports nothing
 * from `@tauri-apps/*`, so the browser bundle is unchanged and every function
 * here is a safe no-op when Daily OS runs as a plain web app.
 */

type InvokeFn = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
type UnlistenFn = () => void;
type ListenFn = <T>(
  event: string,
  handler: (event: { payload: T }) => void,
) => Promise<UnlistenFn>;

interface TauriGlobal {
  core?: { invoke?: InvokeFn };
  invoke?: InvokeFn;
  event?: { listen?: ListenFn; emit?: (event: string, payload?: unknown) => Promise<void> };
}

declare global {
  interface Window {
    __TAURI__?: TauriGlobal;
    __TAURI_INTERNALS__?: unknown;
    isTauri?: boolean;
  }
}

/** True only inside the Tauri desktop shell. */
export function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.isTauri || window.__TAURI__ || window.__TAURI_INTERNALS__);
}

function resolveInvoke(): InvokeFn | null {
  const t = typeof window !== "undefined" ? window.__TAURI__ : undefined;
  return t?.core?.invoke ?? t?.invoke ?? null;
}

/**
 * Invoke a Rust command. Resolves to the command's return value inside the
 * shell; rejects (harmlessly) with a sentinel when not running natively — call
 * sites should guard with {@link isTauri} first.
 */
export async function invoke<T = void>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const fn = resolveInvoke();
  if (!fn) throw new Error("not-tauri");
  return fn<T>(cmd, args);
}

/** Subscribe to a native event. Returns an unlisten fn (no-op off-shell). */
export async function listen<T = unknown>(
  event: string,
  handler: (payload: T) => void,
): Promise<UnlistenFn> {
  const l = typeof window !== "undefined" ? window.__TAURI__?.event?.listen : undefined;
  if (!l) return () => {};
  return l<T>(event, (e) => handler(e.payload));
}
