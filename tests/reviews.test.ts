import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "./helpers/testDb";
import { runWithDb } from "~/server/runtime";
import { listReviews, listFeaturedReviews } from "~/server/reviews";

let db: D1Database;
beforeEach(async () => {
  db = createTestDb();
  // Pas d'interface d'écriture pour les avis (ils viennent de la migration
  // de données) : on les insère comme le ferait cette migration.
  const insert = (author: string, featured: number, position: number) =>
    db
      .prepare("INSERT INTO reviews (author, stars, body, is_featured, position) VALUES (?, 5, 'Top', ?, ?)")
      .bind(author, featured, position)
      .run();
  await insert("Charlie", 0, 2);
  await insert("Alice", 1, 0);
  await insert("Bob", 1, 1);
});

describe("avis clients", () => {
  it("liste tous les avis dans l'ordre prévu", async () => {
    expect((await runWithDb(db, listReviews)).map((r) => r.author)).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("le carrousel d'accueil ne montre que les avis mis en avant", async () => {
    expect((await runWithDb(db, listFeaturedReviews)).map((r) => r.author)).toEqual(["Alice", "Bob"]);
  });
});
