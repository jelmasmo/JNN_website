// Communes autour de Drogenbos citées sur la page d'accueil : elles aident
// Google à proposer JNN aux personnes qui cherchent une voiture d'occasion
// près de chez elles. Logique pure, testée dans tests/area.test.ts.

import type { Lang } from "./i18n";

/** Nom français et néerlandais de chaque commune, de la plus proche à la plus éloignée. */
const TOWNS: { fr: string; nl: string; official: "fr" | "nl" }[] = [
  { fr: "Drogenbos", nl: "Drogenbos", official: "nl" },
  { fr: "Uccle", nl: "Ukkel", official: "fr" },
  { fr: "Forest", nl: "Vorst", official: "fr" },
  { fr: "Anderlecht", nl: "Anderlecht", official: "fr" },
  { fr: "Linkebeek", nl: "Linkebeek", official: "nl" },
  { fr: "Beersel", nl: "Beersel", official: "nl" },
  { fr: "Ruisbroek", nl: "Ruisbroek", official: "nl" },
  { fr: "Leeuw-Saint-Pierre", nl: "Sint-Pieters-Leeuw", official: "nl" },
  { fr: "Rhode-Saint-Genèse", nl: "Sint-Genesius-Rode", official: "nl" },
  { fr: "Hal", nl: "Halle", official: "nl" },
  { fr: "Bruxelles", nl: "Brussel", official: "fr" },
];

/** Communes voisines, nommées dans la langue du visiteur (nom officiel en anglais, « Brussels » excepté). */
export function nearbyTowns(lang: Lang): string[] {
  if (lang === "en") return TOWNS.map((town) => (town.fr === "Bruxelles" ? "Brussels" : town[town.official]));
  return TOWNS.map((town) => town[lang]);
}
