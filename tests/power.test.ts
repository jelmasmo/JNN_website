import { describe, it, expect } from "vitest";
import { kwToCh, powerLabel } from "~/lib/power";

describe("kwToCh", () => {
  it("convertit les kW en chevaux avec le facteur 1.35962", () => {
    // Valeurs réelles des véhicules du prototype, pour garantir qu'on
    // n'affiche jamais une puissance différente de ce que voyaient déjà
    // les visiteurs du site actuel.
    expect(kwToCh(85)).toBe(116); // Audi A1 / Mercedes A180d
    expect(kwToCh(110)).toBe(150); // BMW 118d
    expect(kwToCh(150)).toBe(204); // Range Rover Evoque
    expect(kwToCh(92)).toBe(125); // Golf 7
    expect(kwToCh(96)).toBe(131); // Peugeot 2008
  });

  it("arrondit à l'entier le plus proche", () => {
    expect(kwToCh(1)).toBe(1);
    expect(kwToCh(0)).toBe(0);
  });
});

describe("powerLabel", () => {
  it("affiche kW et ch entre parenthèses", () => {
    expect(powerLabel(85)).toBe("85 kW (116 ch)");
  });

  it("retourne un tiret si la puissance est inconnue", () => {
    expect(powerLabel(null)).toBe("—");
    expect(powerLabel(undefined)).toBe("—");
    expect(powerLabel(0)).toBe("—");
  });
});
