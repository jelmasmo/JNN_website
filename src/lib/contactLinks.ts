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

/** Lien WhatsApp vers JNN au sujet d'un véhicule (`extra` = message libre du visiteur). */
export function vehicleWhatsAppUrl(vehicle: ContactVehicle, phone: string, pageUrl: string, extra: string): string {
  let msg = `Bonjour, je suis intéressé(e) par le véhicule ${vehicle.title} (${fmtPrice(vehicle.price)}) : ${pageUrl}`;
  if (extra.trim()) msg += `\n\n${extra.trim()}`;
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`;
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

/** Lien WhatsApp pour envoyer la carte de visite à un client ; `null` si aucun numéro. */
export function shareCardWhatsAppUrl(clientNumber: string, settings: SiteSettings): string | null {
  const num = clientNumber.replace(/[^0-9]/g, "");
  if (!num) return null;
  const text = `Bonjour, voici mes coordonnées :\n${cardText(settings)}`;
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
