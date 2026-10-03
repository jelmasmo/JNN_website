import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "./helpers/testDb";
import { runWithDb } from "~/server/runtime";
import { listListings, markListingPublished, removeListing, publishVehicleListing } from "~/server/listings";
import { createVehicle, updateVehicle, getVehicle, type VehicleInput } from "~/server/vehicles";
import { listingStatus } from "~/lib/listingKit";

const published = { vehicleId: "MINI-17", platform: "2ememain", vehicleTitle: "Mini Cooper Seven", listingUrl: "https://www.2ememain.be/v/123", fingerprint: "v1" };

describe("suivi des annonces publiées sur les plateformes", () => {
  let db: D1Database;
  beforeEach(() => {
    db = createTestDb();
  });

  it("retient qu'une annonce a été publiée sur une plateforme, avec son lien", async () => {
    await runWithDb(db, markListingPublished(published));
    const listings = await runWithDb(db, listListings());
    expect(listings).toHaveLength(1);
    expect(listings[0]).toMatchObject({ vehicle_id: "MINI-17", platform: "2ememain", listing_url: "https://www.2ememain.be/v/123", fingerprint: "v1" });
  });

  it("suit chaque plateforme séparément pour une même voiture", async () => {
    await runWithDb(db, markListingPublished(published));
    await runWithDb(db, markListingPublished({ ...published, platform: "facebook", listingUrl: null }));
    expect((await runWithDb(db, listListings())).map((l) => l.platform).sort()).toEqual(["2ememain", "facebook"]);
  });

  it("remplace les informations quand l'annonce est remise à jour, sans perdre son lien", async () => {
    await runWithDb(db, markListingPublished(published));
    await runWithDb(db, markListingPublished({ ...published, listingUrl: null, fingerprint: "v2" }));
    const listings = await runWithDb(db, listListings());
    expect(listings).toHaveLength(1);
    expect(listings[0]).toMatchObject({ fingerprint: "v2", listing_url: "https://www.2ememain.be/v/123" });
  });

  it("oublie une annonce une fois retirée de la plateforme", async () => {
    await runWithDb(db, markListingPublished(published));
    await runWithDb(db, removeListing("MINI-17", "2ememain"));
    expect(await runWithDb(db, listListings())).toEqual([]);
  });

  it("refuse une plateforme inconnue", async () => {
    await runWithDb(db, markListingPublished({ ...published, platform: "inconnue" }));
    expect(await runWithDb(db, listListings())).toEqual([]);
  });

  it("repère qu'une annonce publiée est à mettre à jour après un changement de prix sur le site", async () => {
    const input: VehicleInput = {
      id: "MINI-17", title: "Mini Cooper Seven", sub: "", type: "citadine", first_reg: "05/2017", km: 62000,
      fuel: "Essence", gearbox: "Automatique", kw: 100, color: "Bleu", price: 15000, description: "", options: [], images: [],
    };
    await runWithDb(db, createVehicle(input));
    expect(await runWithDb(db, publishVehicleListing("MINI-17", "facebook", null))).toBe(true);
    const [listing] = await runWithDb(db, listListings());
    expect(listingStatus(await runWithDb(db, getVehicle("MINI-17")), listing)).toBe("a_jour");

    await runWithDb(db, updateVehicle("MINI-17", { ...input, price: 14500 }));
    expect(listingStatus(await runWithDb(db, getVehicle("MINI-17")), listing)).toBe("a_mettre_a_jour");
  });

  it("ne publie rien pour une voiture qui n'existe pas", async () => {
    expect(await runWithDb(db, publishVehicleListing("FANTOME", "facebook", null))).toBe(false);
    expect(await runWithDb(db, listListings())).toEqual([]);
  });
});
