import { describe, it, expect } from "vitest";
import { nextSlide } from "~/lib/carousel";

describe("défilement des avis dans la carte d'accueil", () => {
  it("passe à l'avis suivant", () => {
    expect(nextSlide(0, 5)).toBe(1);
  });

  it("revient au premier avis après le dernier", () => {
    expect(nextSlide(4, 5)).toBe(0);
  });

  it("reste sur 0 s'il n'y a aucun avis", () => {
    expect(nextSlide(0, 0)).toBe(0);
  });
});
