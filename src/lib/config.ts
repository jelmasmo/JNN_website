// Coordonnées affichées sur la carte de visite et utilisées pour les liens
// WhatsApp / e-mail par défaut. À adapter aux vraies coordonnées de JNN.
import type { Lang } from "./i18n";

/** Format des nombres pour chaque langue du site. */
const LOCALES: Record<Lang, string> = { fr: "fr-BE", nl: "nl-BE", en: "en-GB" };

export const OWNER = {
  name: "Edan",
  role: "Vente de véhicules d'occasion",
  phone: "+32 470 00 00 00",
  email: "JNN1620@outlook.com",
  address: "Grote Baan 361/1, 1620 Drogenbos",
  website: "https://jnn-drogenbos.be",
};

export const FILTERS = [
  { key: "tous", label: "Tous les véhicules" },
  { key: "citadine", label: "Citadines" },
  { key: "berline", label: "Berlines" },
  { key: "suv", label: "SUV" },
] as const;

/** Prix en euros, écrit selon les habitudes de la langue d'affichage. */
export function fmtPrice(p: number, lang: Lang = "fr"): string {
  const amount = Number(p).toLocaleString(LOCALES[lang]);
  if (lang === "nl") return `€ ${amount}`;
  if (lang === "en") return `€${amount}`;
  return `${amount} €`;
}
export function fmtKm(k: number, lang: Lang = "fr"): string {
  return Number(k).toLocaleString(LOCALES[lang]) + " km";
}
