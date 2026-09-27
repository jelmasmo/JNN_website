import { describe, it, expect } from "vitest";
import { fmtPrice, fmtKm } from "~/lib/config";

describe("fmtPrice", () => {
  it("affiche le prix au format belge suivi de l'euro", () => {
    expect(fmtPrice(15900)).toBe("15 900 €");
  });
});

describe("fmtKm", () => {
  it("affiche le kilométrage au format belge suivi de km", () => {
    expect(fmtKm(41000)).toBe("41 000 km");
  });
});
