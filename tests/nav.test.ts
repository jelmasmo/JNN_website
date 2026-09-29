import { describe, it, expect } from "vitest";
import { activeNavKey } from "~/lib/nav";

describe("onglet actif du menu principal", () => {
  it("met « Avis clients » en avant sur la page des avis", () => {
    expect(activeNavKey("/avis")).toBe("avis");
  });

  it("met « Stock » en avant sur la fiche d'un véhicule", () => {
    expect(activeNavKey("/vehicules/GOLF7")).toBe("stock");
  });

  it("ne met aucun onglet en avant sur l'accueil", () => {
    expect(activeNavKey("/")).toBeNull();
  });
});
