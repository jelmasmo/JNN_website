import { Effect } from "effect";
import { query, run } from "./db";
import { classifySource } from "~/lib/trafficSource";

// Suivi des visites pour le rapport du tableau de bord : d'où viennent les
// visiteurs, quelles voitures ils regardent, lesquels prennent contact.
// Aucune donnée personnelle : ni adresse IP, ni cookie, ni identifiant —
// seulement la provenance, la page et une ville approximative.

const EVENT_TYPES = ["home_view", "vehicle_view", "contact_whatsapp", "contact_email"] as const;
export type VisitEventType = (typeof EVENT_TYPES)[number];

export interface VisitInput {
  eventType: VisitEventType;
  vehicleId: string | null;
  path: string;
  /** Site d'origine du visiteur à son arrivée (vide s'il n'y en a pas). */
  referrer: string | null;
  /** Étiquette du lien d'arrivée (?src=whatsapp), s'il y en a une. */
  src: string | null;
  /** Vrai pour la première page vue par le visiteur : c'est elle qui compte comme une visite. */
  isEntry: boolean;
  siteHost: string;
  country: string | null;
  city: string | null;
  region: string | null;
  /** Date et heure UTC « AAAA-MM-JJ HH:MM:SS » (par défaut : maintenant). */
  at?: string;
}

const clip = (value: string | null | undefined, max: number) => (value ? value.slice(0, max) : null);

/** Enregistre un événement de visite ; un type d'événement inconnu est ignoré. */
export function recordVisit(input: VisitInput) {
  return Effect.gen(function* () {
    if (!(EVENT_TYPES as readonly string[]).includes(input.eventType)) return;
    const source = classifySource({ referrer: input.referrer, src: input.src, siteHost: input.siteHost });
    yield* run(
      `INSERT INTO visit_events (event_type, vehicle_id, path, country, city, region, referrer, source, is_entry, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')))`,
      [
        input.eventType,
        clip(input.vehicleId, 80),
        clip(input.path, 200),
        clip(input.country, 8),
        clip(input.city, 80),
        clip(input.region, 80),
        clip(input.referrer, 300),
        source,
        input.isEntry ? 1 : 0,
        input.at ?? null,
      ]
    );
  });
}

export interface VisitReport {
  totals: { visits: number; vehicleViews: number; contacts: number };
  bySource: { source: string; visits: number; contacts: number }[];
  byVehicle: { vehicle_id: string; views: number; contacts: number }[];
  byDay: { day: string; visits: number }[];
  byPlace: { country: string | null; city: string | null; visits: number }[];
}

/** Rapport des `days` derniers jours (jusqu'à `now`, par défaut maintenant). */
export function visitReport(days: number, now?: string) {
  return Effect.gen(function* () {
    const since = `-${Math.max(1, Math.min(365, Math.floor(days)))} days`;
    const period = "created_at >= datetime(COALESCE(?, datetime('now')), ?)";
    const params = [now ?? null, since];

    const totals = yield* query<VisitReport["totals"]>(
      `SELECT COALESCE(SUM(is_entry), 0) AS visits,
              COALESCE(SUM(event_type = 'vehicle_view'), 0) AS vehicleViews,
              COALESCE(SUM(event_type LIKE 'contact_%'), 0) AS contacts
       FROM visit_events WHERE ${period}`,
      params
    );
    const bySource = yield* query<VisitReport["bySource"][number]>(
      `SELECT source, SUM(is_entry) AS visits, SUM(event_type LIKE 'contact_%') AS contacts
       FROM visit_events WHERE ${period} AND source IS NOT NULL AND source <> 'interne'
       GROUP BY source ORDER BY visits DESC, contacts DESC, source ASC`,
      params
    );
    const byVehicle = yield* query<VisitReport["byVehicle"][number]>(
      `SELECT vehicle_id, SUM(event_type = 'vehicle_view') AS views, SUM(event_type LIKE 'contact_%') AS contacts
       FROM visit_events WHERE ${period} AND vehicle_id IS NOT NULL
       GROUP BY vehicle_id ORDER BY views DESC, contacts DESC, vehicle_id ASC`,
      params
    );
    const byDay = yield* query<VisitReport["byDay"][number]>(
      `SELECT date(created_at) AS day, SUM(is_entry) AS visits
       FROM visit_events WHERE ${period} GROUP BY day HAVING visits > 0 ORDER BY day ASC`,
      params
    );
    const byPlace = yield* query<VisitReport["byPlace"][number]>(
      `SELECT country, city, SUM(is_entry) AS visits
       FROM visit_events WHERE ${period} AND is_entry = 1
       GROUP BY country, city ORDER BY visits DESC, city ASC LIMIT 15`,
      params
    );
    return { totals: totals[0] ?? { visits: 0, vehicleViews: 0, contacts: 0 }, bySource, byVehicle, byDay, byPlace } satisfies VisitReport;
  });
}
