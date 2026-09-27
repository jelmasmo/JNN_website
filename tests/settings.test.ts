import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "./helpers/testDb";
import { runWithDb } from "~/server/runtime";
import { getSettings, updateSettings } from "~/server/settings";

let db: D1Database;
beforeEach(() => {
  db = createTestDb();
});

describe("coordonnées de contact", () => {
  it("affiche les coordonnées par défaut tant qu'elles n'ont pas été modifiées", async () => {
    expect(await runWithDb(db, getSettings)).toEqual({
      phone: "+32 470 00 00 00",
      email: "JNN1620@outlook.com",
      address: "Grote Baan 361/1, 1620 Drogenbos",
    });
  });

  it("les coordonnées modifiées depuis l'admin sont celles affichées ensuite", async () => {
    const nouvelles = { phone: "+32 471 11 22 33", email: "contact@jnn.be", address: "Rue Neuve 1, 1000 Bruxelles" };
    await runWithDb(db, updateSettings(nouvelles));
    expect(await runWithDb(db, getSettings)).toEqual(nouvelles);
  });
});
