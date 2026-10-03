// Diffusion d'une annonce sur les plateformes (AutoScout24, 2ememain,
// Facebook Marketplace, Gocar) : le texte prêt à copier pour chaque
// plateforme, et le suivi de ce qui est publié, à mettre à jour ou à
// retirer. Logique pure, testée dans tests/listingKit.test.ts.

import type { Lang } from "./i18n";
import { fmtKm, fmtPrice } from "./config";
import { powerLabel } from "./power";
import { localizeVehicle } from "./localizeVehicle";
import { absoluteUrl } from "./langPath";
import type { VehicleView } from "~/server/vehicles";

export const PLATFORMS = [
  { key: "autoscout24", name: "AutoScout24", site: "https://www.autoscout24.be" },
  { key: "2ememain", name: "2ememain / 2dehands", site: "https://www.2ememain.be" },
  { key: "facebook", name: "Facebook Marketplace", site: "https://www.facebook.com/marketplace" },
  { key: "gocar", name: "Gocar", site: "https://gocar.be" },
] as const;
export type PlatformKey = (typeof PLATFORMS)[number]["key"];

export interface ListingContact {
  phone: string;
  email: string;
  address: string;
}

/** Phrases fixes de l'annonce, par langue. JNN s'y présente toujours comme vendeur professionnel. */
const TEXTS: Record<Lang, { price: string; firstReg: string; color: string; equipment: string; seller: string; visit: string; more: string; contact: string }> = {
  fr: {
    price: "Prix",
    firstReg: "1re immatriculation",
    color: "Couleur",
    equipment: "Équipements",
    seller: "Vendu par JNN Drogenbos, vendeur professionnel : garantie légale d'un an, véhicule vérifié et préparé avant la vente.",
    visit: "Visite et essai sur rendez-vous.",
    more: "Toutes les photos et les détails",
    contact: "Contact",
  },
  nl: {
    price: "Prijs",
    firstReg: "1e inschrijving",
    color: "Kleur",
    equipment: "Uitrusting",
    seller: "Verkocht door JNN Drogenbos, professionele verkoper: één jaar wettelijke garantie, wagen gecontroleerd en klaargemaakt voor verkoop.",
    visit: "Bezichtiging en proefrit op afspraak.",
    more: "Alle foto's en details",
    contact: "Contact",
  },
  en: {
    price: "Price",
    firstReg: "First registration",
    color: "Colour",
    equipment: "Equipment",
    seller: "Sold by JNN Drogenbos, professional dealer: one-year legal warranty, vehicle inspected and prepared before sale.",
    visit: "Viewing and test drive by appointment.",
    more: "All photos and details",
    contact: "Contact",
  },
};

const year = (firstReg: string | null) => firstReg?.match(/(\d{4})/)?.[1] ?? "";

export interface ListingKit {
  title: string;
  text: string;
  /** Lien vers la fiche du site, étiqueté pour le rapport de provenance (?src=…). */
  url: string;
}

/** Titre, texte et lien d'une annonce, prêts à être copiés sur une plateforme. */
export function listingKit(vehicle: VehicleView, lang: Lang, platform: PlatformKey, contact: ListingContact): ListingKit {
  const shown = localizeVehicle(vehicle, lang);
  const tx = TEXTS[lang];
  const url = `${absoluteUrl(`/vehicules/${encodeURIComponent(vehicle.id)}`, lang)}?src=${platform}`;
  const title = [[vehicle.title, year(vehicle.first_reg)].filter(Boolean).join(" "), shown.gearbox, fmtKm(vehicle.km, lang)]
    .filter(Boolean)
    .join(" – ");

  const facts = [
    fmtKm(vehicle.km, lang),
    shown.fuel,
    shown.gearbox,
    vehicle.kw ? powerLabel(vehicle.kw, lang) : "",
  ].filter(Boolean);

  const lines: string[] = [];
  lines.push([vehicle.title, shown.sub].filter(Boolean).join(" — "));
  lines.push(`${tx.price} : ${fmtPrice(vehicle.price, lang)}`);
  lines.push(facts.join(" · "));
  if (vehicle.first_reg) lines.push(`${tx.firstReg} : ${vehicle.first_reg}`);
  if (shown.color) lines.push(`${tx.color} : ${shown.color}`);
  if (shown.description) lines.push("", shown.description);
  if (shown.options.length) lines.push("", `${tx.equipment} :`, ...shown.options.map((o) => `- ${o}`));
  lines.push("", tx.seller, tx.visit);
  lines.push("", `${tx.more} : ${url}`);
  lines.push("", `${tx.contact} : ${contact.phone} (WhatsApp) — ${contact.address}`);
  return { title, text: lines.join("\n"), url };
}

/**
 * Empreinte de ce qu'un acheteur voit dans l'annonce (prix, textes,
 * caractéristiques, photos) : si elle change après la publication,
 * l'annonce est à mettre à jour sur la plateforme.
 */
export function listingFingerprint(vehicle: VehicleView): string {
  return JSON.stringify([
    vehicle.title,
    vehicle.sub,
    vehicle.first_reg,
    vehicle.km,
    vehicle.fuel,
    vehicle.gearbox,
    vehicle.kw,
    vehicle.color,
    vehicle.price,
    vehicle.description,
    vehicle.options,
    vehicle.images,
  ]);
}

export type ListingStatus = "absente" | "a_jour" | "a_mettre_a_jour" | "a_retirer";

/** Où en est l'annonce d'une voiture sur une plateforme (`vehicle` null : voiture supprimée du site). */
export function listingStatus(vehicle: VehicleView | null, published: { fingerprint: string } | null): ListingStatus {
  if (!published) return "absente";
  if (!vehicle || vehicle.sold_at) return "a_retirer";
  return published.fingerprint === listingFingerprint(vehicle) ? "a_jour" : "a_mettre_a_jour";
}

export const STATUS_LABELS: Record<ListingStatus, string> = {
  absente: "Pas encore publiée",
  a_jour: "Publiée, à jour",
  a_mettre_a_jour: "À mettre à jour",
  a_retirer: "À retirer",
};
