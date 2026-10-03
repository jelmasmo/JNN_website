// Référencement et aperçus de liens : sitemap, robots.txt, balises d'aperçu
// (WhatsApp, Facebook…) et données structurées schema.org lues par Google.
// Logique pure, testée dans tests/seo.test.ts.

import { t, type Lang } from "./i18n";
import { fmtKm, fmtPrice } from "./config";
import { powerLabel } from "./power";
import { localizeVehicle } from "./localizeVehicle";
import type { VehicleView } from "~/server/vehicles";
import { SITE_URL, absoluteUrl, alternateLinks } from "./langPath";

export { SITE_URL };

/** Image d'aperçu par défaut : la carte de visite JNN (public/carte-jnn.jpg). */
export const DEFAULT_IMAGE = `${SITE_URL}/carte-jnn.jpg`;
const BUSINESS_NAME = "JNN Drogenbos";

/** Adresse complète d'une fiche véhicule dans une langue. */
export function vehicleUrl(id: string, lang: Lang = "fr"): string {
  return absoluteUrl(`/vehicules/${encodeURIComponent(id)}`, lang);
}

/**
 * Plan du site pour Google : accueil, avis et chaque véhicule en stock,
 * dans les trois langues, chaque adresse reliée à ses autres versions.
 */
export function sitemapXml(vehicleIds: string[]): string {
  const paths = ["/", "/avis", ...vehicleIds.map((id) => `/vehicules/${encodeURIComponent(id)}`)];
  const langs: Lang[] = ["fr", "nl", "en"];
  const entries = paths.flatMap((path) => {
    const alternates = alternateLinks(path)
      .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hrefLang}" href="${escapeXml(a.href)}"/>`)
      .join("\n");
    return langs.map((lang) => `  <url>\n    <loc>${escapeXml(absoluteUrl(path, lang))}</loc>\n${alternates}\n  </url>`);
  });
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries.join("\n") +
    "\n</urlset>\n"
  );
}

/** Consignes aux robots : tout explorer sauf l'espace professionnel. */
export function robotsTxt(): string {
  return ["User-agent: *", "Disallow: /admin", "", `Sitemap: ${SITE_URL}/sitemap.xml`, ""].join("\n");
}

/** « 03/2021 » → « 2021 » (année de première immatriculation). */
function year(firstReg: string | null): string {
  return firstReg?.match(/(\d{4})/)?.[1] ?? "";
}

/** « 03/2021 » → « 2021-03 » (format de date attendu par schema.org). */
function isoMonth(firstReg: string | null): string | undefined {
  const m = firstReg?.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[2]}-${m[1].padStart(2, "0")}`;
  return year(firstReg) || undefined;
}

/** Vraies photos du véhicule (les annonces sans photo contiennent « placeholder »). */
function photos(vehicle: VehicleView): string[] {
  return vehicle.images.filter((src) => /^https?:\/\//.test(src));
}

export interface VehicleHead {
  title: string;
  description: string;
  image: string;
  url: string;
}

/** Titre, description et image de l'aperçu d'une fiche véhicule. */
export function vehicleHead(vehicle: VehicleView, lang: Lang): VehicleHead {
  const shown = localizeVehicle(vehicle, lang);
  const name = [vehicle.title, year(vehicle.first_reg)].filter(Boolean).join(" ");
  const facts = [
    fmtKm(vehicle.km, lang),
    shown.fuel,
    shown.gearbox,
    vehicle.kw ? powerLabel(vehicle.kw, lang) : "",
  ].filter(Boolean);
  const description = [shown.sub, facts.join(" · ")].filter(Boolean).join(" — ") + ". " + t(lang, "meta.vehicleAt");
  return {
    title: `${name} – ${fmtPrice(vehicle.price, lang)} | ${BUSINESS_NAME}`,
    description,
    image: photos(vehicle)[0] ?? DEFAULT_IMAGE,
    url: vehicleUrl(vehicle.id, lang),
  };
}

export interface ContactSettings {
  phone: string;
  email: string;
  address: string;
}

/** « Grote Baan 361/1, 1620 Drogenbos » → rue, code postal, commune. */
function postalAddress(address: string) {
  const m = address.match(/^(.*?),\s*(\d{4})\s+(.+)$/);
  return {
    "@type": "PostalAddress",
    streetAddress: m ? m[1].trim() : address,
    ...(m ? { postalCode: m[2], addressLocality: m[3].trim() } : {}),
    addressCountry: "BE",
  };
}

/** Fiche « garage » schema.org : nom, coordonnées, adresse. */
export function dealerJsonLd(settings: ContactSettings): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${SITE_URL}/#jnn`,
    name: BUSINESS_NAME,
    url: SITE_URL,
    image: DEFAULT_IMAGE,
    telephone: settings.phone,
    email: settings.email,
    address: postalAddress(settings.address),
  };
}

/** Données schema.org d'un véhicule : une voiture d'occasion à vendre chez JNN. */
export function vehicleJsonLd(vehicle: VehicleView, lang: Lang, settings: ContactSettings): Record<string, unknown> {
  const shown = localizeVehicle(vehicle, lang);
  const url = vehicleUrl(vehicle.id, lang);
  const { "@context": _ctx, ...seller } = dealerJsonLd(settings);
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: vehicle.title,
    url,
    ...(shown.description || shown.sub ? { description: shown.description || shown.sub } : {}),
    ...(photos(vehicle).length ? { image: photos(vehicle) } : {}),
    itemCondition: "https://schema.org/UsedCondition",
    mileageFromOdometer: { "@type": "QuantitativeValue", value: vehicle.km, unitCode: "KMT" },
    ...(isoMonth(vehicle.first_reg) ? { dateVehicleFirstRegistered: isoMonth(vehicle.first_reg) } : {}),
    ...(shown.fuel ? { fuelType: shown.fuel } : {}),
    ...(shown.gearbox ? { vehicleTransmission: shown.gearbox } : {}),
    ...(shown.color ? { color: shown.color } : {}),
    ...(vehicle.kw
      ? { vehicleEngine: { "@type": "EngineSpecification", enginePower: { "@type": "QuantitativeValue", value: vehicle.kw, unitCode: "KWT" } } }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      price: vehicle.price,
      priceCurrency: "EUR",
      availability: vehicle.sold_at ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      seller,
    },
  };
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
