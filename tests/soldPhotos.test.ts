import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "./helpers/testDb";
import { runWithDb } from "~/server/runtime";
import { addSoldPhoto, listSoldPhotos, removeSoldPhoto } from "~/server/photos";

let db: D1Database;
beforeEach(() => {
  db = createTestDb();
});

describe("panorama des véhicules vendus", () => {
  it("affiche les photos ajoutées dans l'ordre choisi", async () => {
    await runWithDb(db, addSoldPhoto("https://photos/2.jpg", 1));
    await runWithDb(db, addSoldPhoto("https://photos/1.jpg", 0));
    expect((await runWithDb(db, listSoldPhotos())).map((p) => p.url)).toEqual([
      "https://photos/1.jpg",
      "https://photos/2.jpg",
    ]);
  });

  it("une photo retirée n'apparaît plus", async () => {
    await runWithDb(db, addSoldPhoto("https://photos/1.jpg", 0));
    await runWithDb(db, addSoldPhoto("https://photos/2.jpg", 1));
    const [first] = await runWithDb(db, listSoldPhotos());
    await runWithDb(db, removeSoldPhoto(first.id));
    expect((await runWithDb(db, listSoldPhotos())).map((p) => p.url)).toEqual(["https://photos/2.jpg"]);
  });
});
