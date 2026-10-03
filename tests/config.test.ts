import { describe, it, expect } from "vitest";
import { fmtPrice, fmtKm } from "~/lib/config";

describe("fmtPrice", () => {
  it("affiche le prix au format belge suivi de l'euro", () => {
    expect(fmtPrice(15900)).toBe("15 900 €");
  });
});

describe("fmtPrice selon la langue", () => {
  it("suit les habitudes d'écriture du néerlandais et de l'anglais", () => {
    expect(fmtPrice(15900, "nl")).toBe("€ 15.900");
    expect(fmtPrice(15900, "en")).toBe("€15,900");
  });
});

describe("fmtKm", () => {
  it("affiche le kilométrage au format belge suivi de km", () => {
    expect(fmtKm(41000)).toBe("41 000 km");
  });
});

describe("fmtKm selon la langue", () => {
  it("sépare les milliers à la manière néerlandaise ou anglaise", () => {
    expect(fmtKm(41000, "nl")).toBe("41.000 km");
    expect(fmtKm(41000, "en")).toBe("41,000 km");
  });
});
