import { describe, it, expect } from "vitest";
import { localizeVehicle } from "~/lib/localizeVehicle";
import type { VehicleView } from "~/server/vehicles";

const audi: VehicleView = {
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
  images: [],
  position: 0,
  sold_at: null,
  translations: {
    nl: { sub: "Stadswagen — Sportback", color: "Blauw", description: "Zeer net.", options: ["Airco"] },
  },
};

describe("annonce affichée dans la langue du visiteur", () => {
  it("affiche les textes traduits de l'annonce en néerlandais", () => {
    expect(localizeVehicle(audi, "nl")).toMatchObject({
      title: "Audi A1",
      sub: "Stadswagen — Sportback",
      color: "Blauw",
      description: "Zeer net.",
      options: ["Airco"],
      fuel: "Benzine",
      gearbox: "Manueel",
    });
  });

  it("sans traduction disponible, garde les textes français mais traduit carburant et boîte", () => {
    expect(localizeVehicle(audi, "en")).toMatchObject({
      sub: "Citadine — Sportback",
      description: "Très propre.",
      fuel: "Petrol",
      gearbox: "Manual",
    });
  });

  it("une traduction incomplète ne remplace pas un texte par du vide", () => {
    const partial = { ...audi, translations: { en: { sub: "", color: "Blue", description: "", options: [] } } };
    expect(localizeVehicle(partial, "en")).toMatchObject({
      sub: "Citadine — Sportback",
      color: "Blue",
      description: "Très propre.",
      options: ["Climatisation"],
    });
  });
});

