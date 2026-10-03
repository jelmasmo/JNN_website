// Suivi des visites côté navigateur : envoie au serveur les pages vues et les
// prises de contact, avec l'origine de la visite (voir ./visitOrigin.ts).

import { useEffect } from "react";
import { recordVisit } from "~/server/functions";
import { getAdminToken } from "./adminSession";
import { visitOrigin } from "./visitOrigin";

type VisitEvent = "home_view" | "vehicle_view" | "contact_whatsapp" | "contact_email";

/** Envoie un événement de visite au serveur ; les visites de l'admin connecté ne sont pas comptées. */
export function trackVisit(eventType: VisitEvent, vehicleId: string | null = null): void {
  if (typeof window === "undefined" || getAdminToken()) return;
  const origin = visitOrigin(sessionStore(), { referrer: document.referrer, search: window.location.search });
  recordVisit({
    data: { eventType, vehicleId, path: window.location.pathname, referrer: origin.referrer, src: origin.src, isEntry: origin.isEntry },
  }).catch(() => {});
}

/** Compte l'affichage d'une page (accueil ou fiche véhicule) une fois par affichage. */
export function useTrackPageView(eventType: "home_view" | "vehicle_view", vehicleId: string | null = null): void {
  useEffect(() => {
    trackVisit(eventType, vehicleId);
  }, [eventType, vehicleId]);
}

/** Mémoire de session du navigateur, ou une mémoire vide si elle est bloquée. */
function sessionStore(): Pick<Storage, "getItem" | "setItem"> {
  try {
    return window.sessionStorage;
  } catch {
    return { getItem: () => null, setItem: () => {} };
  }
}
