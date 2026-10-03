import { describe, it, expect } from "vitest";
import { PLATFORMS, listingKit, listingFingerprint, listingStatus } from "~/lib/listingKit";
import { fmtKm } from "~/lib/config";
import type { VehicleView } from "~/server/vehicles";

function car(overrides: Partial<VehicleView> = {}): VehicleView {
  return {
    id: "MINI-17",
    title: "Mini Cooper Seven",
    sub: "Citadine premium",
    type: "citadine",
    first_reg: "05/2017",
    km: 62000,
    fuel: "Essence",
    gearbox: "Automatique",
    kw: 100,
    color: "Bleu",
    price: 15000,
    description: "Carnet d'entretien complet.",
    options: ["GPS", "Sièges chauffants"],
    images: ["https://photos.example/a.jpg"],
    translations: {
      nl: { sub: "Premium stadswagen", color: "Blauw", description: "Volledig onderhoudsboekje.", options: ["GPS", "Verwarmde zetels"] },
    },
    position: 0,
    sold_at: null,
    ...overrides,
  };
}

const settings = { phone: "+32 484 00 00 00", email: "JNN1620@outlook.com", address: "Grote Baan 361/1, 1620 Drogenbos" };

describe("kit d'annonce pour les plateformes", () => {
  it("propose les quatre plateformes du plan de publication", () => {
    expect(PLATFORMS.map((p) => p.key)).toEqual(["autoscout24", "2ememain", "facebook", "gocar"]);
  });

  it("compose un titre avec le modèle, l'année et la boîte", () => {
    expect(listingKit(car(), "fr", "2ememain", settings).title).toBe("Mini Cooper Seven 2017 – Automatique – 62 000 km".replace(" 000", " 000"));
  });

  it("résume la voiture, reprend la description et les équipements", () => {
    const text = listingKit(car(), "fr", "2ememain", settings).text;
    expect(text).toContain("Essence");
    expect(text).toContain("100 kW (136 ch)");
    expect(text).toContain("Carnet d'entretien complet.");
    expect(text).toContain("- GPS");
    expect(text).toContain("- Sièges chauffants");
  });

  it("présente JNN comme vendeur professionnel, avec la garantie et les coordonnées", () => {
    const text = listingKit(car(), "fr", "facebook", settings).text;
    expect(text).toContain("JNN Drogenbos");
    expect(text).toMatch(/vendeur professionnel/i);
    expect(text).toMatch(/garantie/i);
    expect(text).toContain("+32 484 00 00 00");
    expect(text).toContain("Grote Baan 361/1, 1620 Drogenbos");
  });

  it("ajoute le lien de la fiche avec l'étiquette de la plateforme, pour le rapport de provenance", () => {
    expect(listingKit(car(), "fr", "2ememain", settings).url).toBe("https://jnn-drogenbos.be/vehicules/MINI-17?src=2ememain");
    expect(listingKit(car(), "fr", "facebook", settings).text).toContain("https://jnn-drogenbos.be/vehicules/MINI-17?src=facebook");
  });

  it("rédige l'annonce en néerlandais avec les textes traduits et le lien néerlandais", () => {
    const kit = listingKit(car(), "nl", "2ememain", settings);
    expect(kit.text).toContain("Volledig onderhoudsboekje.");
    expect(kit.text).toContain("Benzine");
    expect(kit.text).toContain("- Verwarmde zetels");
    expect(kit.text).toMatch(/professionele verkoper/i);
    expect(kit.url).toBe("https://jnn-drogenbos.be/nl/vehicules/MINI-17?src=2ememain");
  });
});

describe("suivi de diffusion d'une annonce", () => {
  it("signale une annonce pas encore publiée", () => {
    expect(listingStatus(car(), null)).toBe("absente");
  });

  it("considère à jour une annonce publiée avec les informations actuelles", () => {
    expect(listingStatus(car(), { fingerprint: listingFingerprint(car()) })).toBe("a_jour");
  });

  it("demande une mise à jour quand le prix a changé depuis la publication", () => {
    const published = { fingerprint: listingFingerprint(car()) };
    expect(listingStatus(car({ price: 14500 }), published)).toBe("a_mettre_a_jour");
  });

  it("demande une mise à jour quand le texte, le kilométrage ou les photos ont changé", () => {
    const published = { fingerprint: listingFingerprint(car()) };
    expect(listingStatus(car({ description: "Nouveau texte." }), published)).toBe("a_mettre_a_jour");
    expect(listingStatus(car({ km: 63000 }), published)).toBe("a_mettre_a_jour");
    expect(listingStatus(car({ images: ["https://photos.example/a.jpg", "https://photos.example/b.jpg"] }), published)).toBe("a_mettre_a_jour");
  });

  it("ne demande rien pour un simple changement d'ordre dans le stock", () => {
    const published = { fingerprint: listingFingerprint(car()) };
    expect(listingStatus(car({ position: 5 }), published)).toBe("a_jour");
  });

  it("demande de retirer l'annonce d'une voiture vendue ou supprimée", () => {
    const published = { fingerprint: listingFingerprint(car()) };
    expect(listingStatus(car({ sold_at: "2026-10-02" }), published)).toBe("a_retirer");
    expect(listingStatus(null, published)).toBe("a_retirer");
  });

  it("ne réclame rien pour une voiture vendue qui n'était pas publiée", () => {
    expect(listingStatus(car({ sold_at: "2026-10-02" }), null)).toBe("absente");
  });
});
