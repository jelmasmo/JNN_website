import { useSyncExternalStore } from "react";

// Session admin côté client : le jeton signé (voir src/server/auth.ts) est
// gardé dans localStorage et renvoyé à chaque action admin. Pas de vrai
// cookie de session — plus simple, et suffisant pour un seul compte admin.
const STORAGE_KEY = "jnn_admin_token";
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setAdminToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, token);
  notify();
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  notify();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** true dès qu'un jeton est présent côté client (validité vérifiée serveur à chaque action). */
export function useHasAdminToken(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getAdminToken() !== null,
    () => false // rendu serveur : jamais admin (pas de localStorage)
  );
}
