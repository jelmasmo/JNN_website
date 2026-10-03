import { OWNER, fmtPrice } from "./config";
import { t, type Lang } from "./i18n";
import type { SiteSettings } from "./siteSettings";

// Contenus et liens de contact (carte de visite, WhatsApp, e-mail) — logique
// pure, séparée des composants pour être testable.

export function buildVCard(settings: SiteSettings, lang: Lang = "fr"): string {
  return `BEGIN:VCARD\nVERSION:3.0\nFN:${OWNER.name} - JNN\nORG:JNN\nTITLE:${t(lang, "biz.role")}\nTEL;TYPE=CELL:${settings.phone}\nEMAIL:${settings.email}\nADR:;;${settings.address};;;;\nURL:${OWNER.website}\nEND:VCARD`;
}

export interface ContactVehicle {
  id: string;
  title: string;
  price: number;
}

/**
 * Numéro au format attendu par wa.me : indicatif pays + numéro, chiffres
 * seulement. Accepte « +32 470… », « 0032 470… » et le format belge local
 * « 0470… » (le 0 initial est remplacé par l'indicatif 32).
 */
export function whatsAppNumber(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return "32" + digits.slice(1);
  return digits;
}

function whatsAppUrl(phone: string, text: string): string {
  return `https://wa.me/${whatsAppNumber(phone)}?text=${encodeURIComponent(text)}`;
}

/** Lien WhatsApp vers JNN du bouton de l'en-tête (message d'ouverture général). */
export function generalWhatsAppUrl(phone: string, lang: Lang = "fr"): string {
  return whatsAppUrl(phone, t(lang, "msg.general"));
}

/** Lien WhatsApp vers JNN pour demander un rendez-vous (bouton de l'accueil). */
export function appointmentWhatsAppUrl(phone: string, lang: Lang = "fr"): string {
  return whatsAppUrl(phone, t(lang, "msg.appointment"));
}

/** Lien WhatsApp vers JNN au sujet d'un véhicule (`extra` = message libre du visiteur). */
export function vehicleWhatsAppUrl(
  vehicle: ContactVehicle,
  phone: string,
  pageUrl: string,
  extra: string,
  lang: Lang = "fr"
): string {
  let msg = t(lang, "msg.vehicleWhatsApp", { title: vehicle.title, price: fmtPrice(vehicle.price, lang), url: pageUrl });
  if (extra.trim()) msg += `\n\n${extra.trim()}`;
  return `https://wa.me/${whatsAppNumber(phone)}?text=${encodeURIComponent(msg)}`;
}

/** Lien e-mail vers JNN au sujet d'un véhicule (`extra` = message libre du visiteur). */
export function vehicleMailUrl(
  vehicle: ContactVehicle,
  email: string,
  pageUrl: string,
  extra: string,
  lang: Lang = "fr"
): string {
  const price = fmtPrice(vehicle.price, lang);
  let body = t(lang, "msg.vehicleMailBody", { title: vehicle.title, price, url: pageUrl });
  if (extra.trim()) body += `\n\n${extra.trim()}`;
  const subject = t(lang, "msg.vehicleMailSubject", { title: vehicle.title, id: vehicle.id });
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function cardText(settings: SiteSettings, lang: Lang): string {
  return [
    `${OWNER.name} — ${t(lang, "biz.role")}`,
    `JNN, ${settings.address}`,
    `${t(lang, "biz.phoneLabel")} ${settings.phone}`,
    `${t(lang, "biz.emailLineLabel")} ${settings.email}`,
    OWNER.website,
  ].join("\n");
}

/** Image de la carte de visite, servie depuis public/carte-jnn.jpg. */
export const CARD_IMAGE_URL = `${OWNER.website}/carte-jnn.jpg`;

/** Texte qui accompagne l'image de la carte dans le menu de partage du téléphone. */
export function cardShareText(settings: SiteSettings, lang: Lang = "fr"): string {
  return [
    t(lang, "biz.textGreeting"),
    "",
    `JNN Drogenbos — ${t(lang, "biz.tag")}`,
    `${OWNER.name} — ${t(lang, "biz.role")}`,
    `📍 ${settings.address}`,
    `📞 ${settings.phone}`,
    `✉️ ${settings.email}`,
    "",
    t(lang, "biz.textStock", { url: OWNER.website }),
  ].join("\n");
}

/**
 * Version WhatsApp de la carte : gras (*…*) et icônes, et le lien du site
 * seul sur la dernière ligne — WhatsApp en affiche l'aperçu, c'est-à-dire
 * l'image de la carte de visite (balises og:image, voir __root.tsx).
 */
function cardWhatsAppText(settings: SiteSettings, lang: Lang): string {
  return [
    t(lang, "biz.waGreeting"),
    "",
    `*JNN Drogenbos* — ${t(lang, "biz.tag")}`,
    `👤 ${OWNER.name} — ${t(lang, "biz.role")}`,
    `📍 ${settings.address}`,
    `📞 ${settings.phone}`,
    `✉️ ${settings.email}`,
    "",
    t(lang, "biz.waStock"),
    OWNER.website,
  ].join("\n");
}

/** Lien WhatsApp pour envoyer la carte de visite à un client ; `null` si aucun numéro. */
export function shareCardWhatsAppUrl(clientNumber: string, settings: SiteSettings, lang: Lang = "fr"): string | null {
  const num = whatsAppNumber(clientNumber);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(cardWhatsAppText(settings, lang))}`;
}

/** Lien e-mail pour envoyer la carte de visite à un client ; `null` si aucune adresse. */
export function shareCardMailUrl(clientEmail: string, settings: SiteSettings, lang: Lang = "fr"): string | null {
  const to = clientEmail.trim();
  if (!to) return null;
  const subject = t(lang, "biz.mailSubject");
  const body = t(lang, "biz.mailBody", { card: cardText(settings, lang), image: CARD_IMAGE_URL });
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
