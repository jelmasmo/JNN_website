import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "./helpers/testDb";
import { runWithDb } from "~/server/runtime";
import { saveVehicle, getVehicle, createVehicle, translateMissingVehicles, type VehicleInput } from "~/server/vehicles";
import type { Translator } from "~/server/translation";

function vehicle(overrides: Partial<VehicleInput> = {}): VehicleInput {
  return {
    id: "A1-21",
    title: "Audi A1",
    sub: "Citadine — Sportback",
    type: "citadine",
    first_reg: "03/2021",
    km: 41000,
    fuel: "Essence",
    gearbox: "Manuelle",
    kw: 85,
    color: "Bleu",
    price: 15900,
    description: "Très propre.",
    options: ["Climatisation", "GPS"],
    images: [],
    ...overrides,
  };
}

// Traducteur factice (Workers AI est un service externe) : préfixe chaque texte par la langue.
const fakeTranslator: Translator = async (text, lang) => ({
  sub: `[${lang}] ${text.sub}`,
  color: `[${lang}] ${text.color}`,
  description: `[${lang}] ${text.description}`,
  options: text.options.map((o) => `[${lang}] ${o}`),
});

let db: D1Database;
beforeEach(() => {
  db = createTestDb();
});

describe("traduction automatique des annonces", () => {
  it("une annonce enregistrée est traduite en néerlandais et en anglais", async () => {
    await runWithDb(db, saveVehicle({ isNew: true, vehicle: vehicle() }, fakeTranslator));
    const saved = await runWithDb(db, getVehicle("A1-21"));
    expect(saved?.translations.nl).toEqual({
      sub: "[nl] Citadine — Sportback",
      color: "[nl] Bleu",
      description: "[nl] Très propre.",
      options: ["[nl] Climatisation", "[nl] GPS"],
    });
    expect(saved?.translations.en?.description).toBe("[en] Très propre.");
  });

  it("si la traduction échoue, l'annonce est quand même enregistrée (et reste en français)", async () => {
    const brokenTranslator: Translator = async () => {
      throw new Error("Workers AI indisponible");
    };
    await runWithDb(db, saveVehicle({ isNew: true, vehicle: vehicle() }, brokenTranslator));
    const saved = await runWithDb(db, getVehicle("A1-21"));
    expect(saved?.title).toBe("Audi A1");
    expect(saved?.translations).toEqual({});
  });

  it("les annonces existantes pas encore traduites peuvent être traduites en une fois", async () => {
    await runWithDb(db, createVehicle(vehicle({ id: "V1" })));
    await runWithDb(db, createVehicle(vehicle({ id: "V2", description: "Comme neuve." })));
    const count = await runWithDb(db, translateMissingVehicles(fakeTranslator));
    expect(count).toBe(2);
    expect((await runWithDb(db, getVehicle("V2")))?.translations.nl?.description).toBe("[nl] Comme neuve.");
  });

  it("une annonce déjà traduite n'est pas retraduite", async () => {
    await runWithDb(db, saveVehicle({ isNew: true, vehicle: vehicle({ id: "V1" }) }, fakeTranslator));
    await runWithDb(db, createVehicle(vehicle({ id: "V2" })));
    expect(await runWithDb(db, translateMissingVehicles(fakeTranslator))).toBe(1);
  });
});

