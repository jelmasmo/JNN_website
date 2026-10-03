import { t, type Lang } from "./i18n";

// Conversion kW -> chevaux (ch), utilisée sur les fiches véhicules.
// 1 kW = 1.35962 ch (facteur exact repris du prototype).
export function kwToCh(kw: number): number {
  return Math.round(kw * 1.35962);
}

/** « 85 kW (116 ch) », avec l'abréviation des chevaux de la langue (ch / pk / hp). */
export function powerLabel(kw: number | null | undefined, lang: Lang = "fr"): string {
  if (!kw) return "—";
  return `${kw} kW (${kwToCh(kw)} ${t(lang, "power.hp")})`;
}
