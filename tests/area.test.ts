import { describe, it, expect } from "vitest";
import { nearbyTowns } from "~/lib/area";
import { t } from "~/lib/i18n";

describe("zone desservie autour de Drogenbos", () => {
  it("cite les communes voisines sous leur nom français", () => {
    const towns = nearbyTowns("fr");
    expect(towns).toContain("Uccle");
    expect(towns).toContain("Forest");
    expect(towns).toContain("Leeuw-Saint-Pierre");
  });

  it("cite les mêmes communes sous leur nom néerlandais", () => {
    const towns = nearbyTowns("nl");
    expect(towns).toContain("Ukkel");
    expect(towns).toContain("Vorst");
    expect(towns).toContain("Sint-Pieters-Leeuw");
  });

  it("garde en anglais le nom officiel de chaque commune", () => {
    expect(nearbyTowns("en")).toContain("Uccle");
    expect(nearbyTowns("en")).toContain("Sint-Pieters-Leeuw");
  });

  it("présente la zone dans les trois langues en parlant de voitures d'occasion à Drogenbos", () => {
    expect(t("fr", "area.text")).toMatch(/voitures d'occasion/i);
    expect(t("nl", "area.text")).toMatch(/tweedehandswagens/i);
    expect(t("en", "area.text")).toMatch(/used cars/i);
    for (const lang of ["fr", "nl", "en"] as const) expect(t(lang, "area.text")).toContain("Drogenbos");
  });
});
