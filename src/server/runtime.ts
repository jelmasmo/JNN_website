import { Effect } from "effect";
import { layerFromBinding } from "./db";

/**
 * Exécute un programme Effect qui a besoin de la base D1, en lui fournissant
 * le binding réel donné par Cloudflare pour cette requête
 * (`process.env.DB` côté Worker, injecté par le plugin Cloudflare de
 * TanStack Start). Centralise ce point pour ne pas le répéter dans chaque
 * fonction serveur.
 */
export async function runWithDb<A, E>(db: D1Database, program: Effect.Effect<A, E, any>): Promise<A> {
  try {
    return await Effect.runPromise(Effect.provide(program, layerFromBinding(db)));
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/**
 * Effect enveloppe les échecs (FiberFailure, Cause...) avant qu'ils
 * n'atteignent ce catch. On fouille dans les propriétés `message` / `cause`
 * imbriquées jusqu'à trouver un texte exploitable (voir DbError dans
 * ./db.ts, qui fige déjà son propre message), pour ne jamais laisser
 * remonter un "{}" vide jusqu'au navigateur.
 */
function extractErrorMessage(err: unknown, seen = new Set<unknown>()): string {
  if (err == null || seen.has(err)) return "Erreur de base de données inattendue.";
  seen.add(err);
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    if (typeof anyErr.message === "string" && anyErr.message) return anyErr.message;
    if ("cause" in anyErr && anyErr.cause != null) return extractErrorMessage(anyErr.cause, seen);
  }
  return "Erreur de base de données inattendue.";
}
