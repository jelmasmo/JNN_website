import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "./helpers/testDb";
import { runWithDb } from "~/server/runtime";
import {
  listVehicles,
  listAllVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  markVehicleSold,
  saveVehicle,
  type VehicleInput,
} from "~/server/vehicles";
import { bumpStat, listStats } from "~/server/stats";

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
    options: ["Climatisation"],
    images: ["https://photos/a.jpg", "https://photos/b.jpg"],
    ...overrides,
  };
}

let db: D1Database;
beforeEach(() => {
  db = createTestDb();
});

describe("véhicules", () => {
  it("un véhicule créé est retrouvable par sa référence, avec ses options et photos", async () => {
    await runWithDb(db, createVehicle(vehicle()));
    const found = await runWithDb(db, getVehicle("A1-21"));
    expect(found).toMatchObject({
      id: "A1-21",
      title: "Audi A1",
      price: 15900,
      options: ["Climatisation"],
      images: ["https://photos/a.jpg", "https://photos/b.jpg"],
    });
  });

  it("renvoie null pour une référence inconnue", async () => {
    expect(await runWithDb(db, getVehicle("INCONNU"))).toBeNull();
  });

  it("liste le stock dans l'ordre d'ajout", async () => {
    await runWithDb(db, createVehicle(vehicle({ id: "V1" })));
    await runWithDb(db, createVehicle(vehicle({ id: "V2" })));
    await runWithDb(db, createVehicle(vehicle({ id: "V3" })));
    const ids = (await runWithDb(db, listVehicles)).map((v) => v.id);
    expect(ids).toEqual(["V1", "V2", "V3"]);
  });

  it("un véhicule vendu disparaît du stock public mais reste visible côté admin", async () => {
    await runWithDb(db, createVehicle(vehicle({ id: "V1" })));
    await runWithDb(db, createVehicle(vehicle({ id: "V2" })));
    await runWithDb(db, markVehicleSold("V1"));

    expect((await runWithDb(db, listVehicles)).map((v) => v.id)).toEqual(["V2"]);
    expect((await runWithDb(db, listAllVehicles)).map((v) => v.id)).toEqual(["V1", "V2"]);
  });

  it("modifier un véhicule sans changer sa référence met à jour son contenu", async () => {
    await runWithDb(db, createVehicle(vehicle()));
    await runWithDb(db, updateVehicle("A1-21", vehicle({ price: 14500, images: ["https://photos/c.jpg"] })));
    const found = await runWithDb(db, getVehicle("A1-21"));
    expect(found).toMatchObject({ price: 14500, images: ["https://photos/c.jpg"] });
  });

  it("renommer la référence d'un véhicule conserve sa place dans le stock", async () => {
    await runWithDb(db, createVehicle(vehicle({ id: "V1" })));
    await runWithDb(db, createVehicle(vehicle({ id: "V2" })));
    await runWithDb(db, createVehicle(vehicle({ id: "V3" })));
    await runWithDb(db, updateVehicle("V3", vehicle({ id: "V3-BIS" })));

    expect((await runWithDb(db, listVehicles)).map((v) => v.id)).toEqual(["V1", "V2", "V3-BIS"]);
    expect(await runWithDb(db, getVehicle("V3"))).toBeNull();
  });

  it("renommer la référence d'un véhicule conserve ses statistiques", async () => {
    await runWithDb(db, createVehicle(vehicle({ id: "V1" })));
    await runWithDb(db, bumpStat("V1", "views"));
    await runWithDb(db, updateVehicle("V1", vehicle({ id: "V1-BIS" })));

    expect(await runWithDb(db, listStats())).toEqual([{ vehicle_id: "V1-BIS", views: 1, contacts: 0 }]);
  });

  it("renommer un véhicule inexistant échoue avec un message lisible", async () => {
    await expect(runWithDb(db, updateVehicle("FANTOME", vehicle({ id: "NOUVEAU" })))).rejects.toThrow(
      'Véhicule "FANTOME" introuvable.'
    );
  });

  it("supprimer un véhicule le retire, même s'il a des statistiques", async () => {
    await runWithDb(db, createVehicle(vehicle()));
    await runWithDb(db, bumpStat("A1-21", "contacts"));
    await runWithDb(db, deleteVehicle("A1-21"));

    expect(await runWithDb(db, getVehicle("A1-21"))).toBeNull();
    expect(await runWithDb(db, listStats())).toEqual([]);
  });

  it("supprimer un véhicule inexistant échoue avec un message lisible", async () => {
    await expect(runWithDb(db, deleteVehicle("FANTOME"))).rejects.toThrow(
      'Véhicule "FANTOME" introuvable (déjà supprimé ?).'
    );
  });
});

describe("enregistrement depuis le formulaire admin", () => {
  it("refuse de créer un véhicule avec une référence déjà utilisée", async () => {
    await runWithDb(db, saveVehicle({ isNew: true, vehicle: vehicle({ id: "V1" }) }));
    await expect(
      runWithDb(db, saveVehicle({ isNew: true, vehicle: vehicle({ id: "V1", title: "Doublon" }) }))
    ).rejects.toThrow('La référence "V1" est déjà utilisée par un autre véhicule.');
  });

  it("refuse de renommer un véhicule vers une référence déjà utilisée", async () => {
    await runWithDb(db, saveVehicle({ isNew: true, vehicle: vehicle({ id: "V1" }) }));
    await runWithDb(db, saveVehicle({ isNew: true, vehicle: vehicle({ id: "V2" }) }));
    await expect(
      runWithDb(db, saveVehicle({ isNew: false, originalId: "V2", vehicle: vehicle({ id: "V1" }) }))
    ).rejects.toThrow('La référence "V1" est déjà utilisée par un autre véhicule.');
  });

  it("modifier un véhicule en gardant sa référence est accepté", async () => {
    await runWithDb(db, saveVehicle({ isNew: true, vehicle: vehicle({ id: "V1" }) }));
    await runWithDb(db, saveVehicle({ isNew: false, originalId: "V1", vehicle: vehicle({ id: "V1", price: 9900 }) }));
    expect(await runWithDb(db, getVehicle("V1"))).toMatchObject({ price: 9900 });
  });
});

describe("statistiques", () => {
  it("compte séparément les vues et les contacts de chaque véhicule", async () => {
    await runWithDb(db, createVehicle(vehicle()));
    await runWithDb(db, bumpStat("A1-21", "views"));
    await runWithDb(db, bumpStat("A1-21", "views"));
    await runWithDb(db, bumpStat("A1-21", "contacts"));

    expect(await runWithDb(db, listStats())).toEqual([{ vehicle_id: "A1-21", views: 2, contacts: 1 }]);
  });
});
