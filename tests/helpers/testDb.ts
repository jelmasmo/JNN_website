import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";

/**
 * Base de test : une vraie base SQLite en mémoire (node:sqlite, intégré à
 * Node) avec le même schéma que la production (les migrations du dossier
 * migrations/, hors données de démonstration), exposée derrière la petite
 * partie de l'interface D1Database que le code serveur utilise
 * (prepare → bind → all / run). Comme D1, les clés étrangères sont actives.
 */
const MIGRATIONS_DIR = new URL("../../migrations/", import.meta.url);

export function createTestDb(): D1Database {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  for (const file of readdirSync(MIGRATIONS_DIR).sort()) {
    if (!file.endsWith(".sql") || file.includes("seed")) continue;
    sqlite.exec(readFileSync(new URL(file, MIGRATIONS_DIR), "utf8"));
  }

  function prepare(sql: string) {
    let params: unknown[] = [];
    const stmt = {
      bind(...values: unknown[]) {
        params = values;
        return stmt;
      },
      async all<T>() {
        return { results: sqlite.prepare(sql).all(...(params as never[])) as T[], success: true, meta: {} };
      },
      async run() {
        sqlite.prepare(sql).run(...(params as never[]));
        return { results: [], success: true, meta: {} };
      },
    };
    return stmt;
  }

  return { prepare } as unknown as D1Database;
}
