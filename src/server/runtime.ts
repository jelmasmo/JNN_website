import { Effect } from "effect";
import { layerFromBinding } from "./db";

/**
 * Exécute un programme Effect qui a besoin de la base D1, en lui fournissant
 * le binding réel donné par Cloudflare pour cette requête
 * (`process.env.DB` côté Worker, injecté par le plugin Cloudflare de
 * TanStack Start). Centralise ce point pour ne pas le répéter dans chaque
 * fonction serveur.
 */
export function runWithDb<A, E>(db: D1Database, program: Effect.Effect<A, E, any>) {
  return Effect.runPromise(Effect.provide(program, layerFromBinding(db)));
}
