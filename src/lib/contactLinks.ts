import { OWNER, fmtPrice } from "./config";
import type { SiteSettings } from "./siteSettings";

// Contenus et liens de contact (carte de visite, WhatsApp, e-mail) — logique
// pure, séparée des composants pour être testable.

export function buildVCard(settings: SiteSettings): string {
  return `BEGIN:VCARD\nVERSION:3.0\nFN:${OWNER.name} - JNN\nORG:JNN\nTITLE:${OWNER.role}\nTEL;TYPE=CELL:${settings.phone}\nEMAIL:${settings.email}\nADR:;;${settings.address};;;;\nURL:${OWNER.website}\nEND:VCARD`;
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

/** Lien WhatsApp vers JNN pour demander un rendez-vous (bouton de l'accueil). */
export function appointmentWhatsAppUrl(phone: string): string {
  const msg = "Bonjour, je souhaiterais prendre rendez-vous pour venir voir vos véhicules chez JNN.";
  return `https://wa.me/${whatsAppNumber(phone)}?text=${encodeURIComponent(msg)}`;
}

/** Lien WhatsApp vers JNN au sujet d'un véhicule (`extra` = message libre du visiteur). */
export function vehicleWhatsAppUrl(vehicle: ContactVehicle, phone: string, pageUrl: string, extra: string): string {
  let msg = `Bonjour, je suis intéressé(e) par le véhicule ${vehicle.title} (${fmtPrice(vehicle.price)}) : ${pageUrl}`;
  if (extra.trim()) msg += `\n\n${extra.trim()}`;
  return `https://wa.me/${whatsAppNumber(phone)}?text=${encodeURIComponent(msg)}`;
}

/** Lien e-mail vers JNN au sujet d'un véhicule (`extra` = message libre du visiteur). */
export function vehicleMailUrl(vehicle: ContactVehicle, email: string, pageUrl: string, extra: string): string {
  let body = `Bonjour,\n\nJe souhaite avoir plus d'informations sur ce véhicule :\n${vehicle.title} — ${fmtPrice(vehicle.price)}\n${pageUrl}`;
  if (extra.trim()) body += `\n\n${extra.trim()}`;
  const subject = `Intéressé par ${vehicle.title} — Réf. ${vehicle.id}`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function cardText(settings: SiteSettings): string {
  return `${OWNER.name} — ${OWNER.role}\nJNN, ${settings.address}\nTél : ${settings.phone}\nE-mail : ${settings.email}\n${OWNER.website}`;
}

/**
 * Version WhatsApp de la carte : gras (*…*) et icônes, et le lien du site
 * seul sur la dernière ligne — WhatsApp en affiche l'aperçu, c'est-à-dire
 * l'image de la carte de visite (balises og:image, voir __root.tsx).
 */
function cardWhatsAppText(settings: SiteSettings): string {
  return [
    "Bonjour 👋 Voici mes coordonnées :",
    "",
    "*JNN Drogenbos* — Véhicules d'occasion",
    `👤 ${OWNER.name} — ${OWNER.role}`,
    `📍 ${settings.address}`,
    `📞 ${settings.phone}`,
    `✉️ ${settings.email}`,
    "",
    "🚗 Découvrez notre stock :",
    OWNER.website,
  ].join("\n");
}

/** Lien WhatsApp pour envoyer la carte de visite à un client ; `null` si aucun numéro. */
export function shareCardWhatsAppUrl(clientNumber: string, settings: SiteSettings): string | null {
  const num = whatsAppNumber(clientNumber);
  if (!num) return null;
  const text = cardWhatsAppText(settings);
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

/** Lien e-mail pour envoyer la carte de visite à un client ; `null` si aucune adresse. */
export function shareCardMailUrl(clientEmail: string, settings: SiteSettings): string | null {
  const to = clientEmail.trim();
  if (!to) return null;
  const subject = "Coordonnées JNN — véhicules d'occasion";
  const body = `Bonjour,\n\nVoici mes coordonnées :\n${cardText(settings)}\n\nÀ bientôt !`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
