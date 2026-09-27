import { describe, it, expect } from "vitest";
import { createTestDb } from "./helpers/testDb";
import { runWithDb } from "~/server/runtime";
import { query } from "~/server/db";

describe("erreurs de base de données", () => {
  it("remontent avec le message d'origine, jamais un objet vide", async () => {
    const db = createTestDb();
    await expect(runWithDb(db, query("SELECT * FROM table_inexistante"))).rejects.toThrow(/table_inexistante/);
  });
});
