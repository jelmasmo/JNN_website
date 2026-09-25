import { Context, Effect, Layer } from "effect";

/**
 * Service Effect qui expose la base D1 (Cloudflare) au reste du code serveur.
 * Le binding réel (`env.DB`) est fourni par Cloudflare au moment de la
 * requête ; on le fait passer dans une Layer construite dans chaque
 * fonction serveur TanStack Start (voir src/server/runtime.ts).
 */
export class D1 extends Context.Tag("D1")<D1, D1Database>() {}

export class DbError {
  readonly _tag = "DbError";
  readonly message: string;
  constructor(readonly cause: unknown) {
    // Le message est extrait tout de suite : une fois que cette erreur
    // traverse la frontière serveur → client (RPC TanStack Start), les
    // propriétés non énumérables d'un vrai Error (message, stack) sont
    // perdues lors de la sérialisation JSON. On les fige ici en une
    // simple chaîne pour ne pas afficher "{}" côté navigateur.
    this.message =
      cause instanceof Error
        ? cause.message
        : typeof cause === "string"
          ? cause
          : (() => {
              try {
                return JSON.stringify(cause);
              } catch {
                return String(cause);
              }
            })();
  }
}

export function query<T = unknown>(sql: string, params: unknown[] = []) {
  return Effect.gen(function* () {
    const db = yield* D1;
    const stmt = db.prepare(sql).bind(...params);
    const result = yield* Effect.tryPromise({
      try: () => stmt.all<T>(),
      catch: (cause) => new DbError(cause),
    });
    return result.results;
  });
}

export function run(sql: string, params: unknown[] = []) {
  return Effect.gen(function* () {
    const db = yield* D1;
    const stmt = db.prepare(sql).bind(...params);
    yield* Effect.tryPromise({
      try: () => stmt.run(),
      catch: (cause) => new DbError(cause),
    });
  });
}

export function layerFromBinding(db: D1Database) {
  return Layer.succeed(D1, db);
}
