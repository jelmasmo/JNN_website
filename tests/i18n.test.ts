import { describe, it, expect } from "vitest";
import { detectLang, t, fuelLabel, gearboxLabel, langCookie } from "~/lib/i18n";

describe("choix de la langue du visiteur", () => {
  it("affiche le néerlandais à un navigateur réglé en néerlandais de Belgique", () => {
    expect(detectLang({ acceptLanguage: "nl-BE,nl;q=0.9,en;q=0.8" })).toBe("nl");
  });

  it("respecte l'ordre de préférence du navigateur", () => {
    expect(detectLang({ acceptLanguage: "en-US,en;q=0.9,fr;q=0.8,nl;q=0.7" })).toBe("en");
    expect(detectLang({ acceptLanguage: "de-DE,fr;q=0.5,nl;q=0.9" })).toBe("nl");
  });

  it("affiche l'anglais quand aucune des trois langues n'est demandée", () => {
    expect(detectLang({ acceptLanguage: "de-DE,de;q=0.9,ar;q=0.8" })).toBe("en");
  });

  it("reste en français pour une requête sans langue (robots d'aperçu WhatsApp, Facebook, Google…)", () => {
    expect(detectLang({ acceptLanguage: "" })).toBe("fr");
    expect(detectLang({})).toBe("fr");
  });

  it("le choix fait avec le sélecteur de langue prime sur la langue du navigateur", () => {
    expect(detectLang({ acceptLanguage: "nl-BE,nl;q=0.9", cookie: "theme=x; jnn-lang=fr; autre=1" })).toBe("fr");
  });

  it("le choix fait avec le sélecteur est retenu pour les visites suivantes", () => {
    const cookie = langCookie("nl");
    expect(cookie).toContain("Max-Age=31536000");
    expect(detectLang({ acceptLanguage: "en-GB", cookie: cookie.split(";")[0] })).toBe("nl");
  });

  it("ignore un choix enregistré qui n'est pas une langue du site", () => {
    expect(detectLang({ acceptLanguage: "nl-BE", cookie: "jnn-lang=de" })).toBe("nl");
  });
});

describe("textes du site", () => {
  it("un texte est affiché dans la langue du visiteur", () => {
    expect(t("fr", "nav.stock")).toBe("Stock");
    expect(t("nl", "nav.stock")).toBe("Aanbod");
    expect(t("en", "nav.stock")).toBe("Stock");
  });

  it("les valeurs variables sont insérées dans le texte traduit", () => {
    expect(t("nl", "stock.countMany", { count: 6 })).toBe("6 wagens beschikbaar");
    expect(t("en", "vehicle.photoIndex", { n: 2, total: 5 })).toBe("Photo 2 / 5");
  });
});

describe("caractéristiques fixes d'une annonce", () => {
  it("le carburant et la boîte choisis dans l'admin sont traduits", () => {
    expect(fuelLabel("Essence", "nl")).toBe("Benzine");
    expect(fuelLabel("Électrique", "en")).toBe("Electric");
    expect(gearboxLabel("Automatique", "nl")).toBe("Automaat");
    expect(gearboxLabel("Manuelle", "en")).toBe("Manual");
  });
});

