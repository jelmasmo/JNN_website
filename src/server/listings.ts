import { Effect } from "effect";
import { query, run } from "./db";
import { PLATFORMS, listingFingerprint } from "~/lib/listingKit";
import { getVehicle } from "./vehicles";

// Suivi de diffusion des annonces sur les plateformes (voir
// src/lib/listingKit.ts pour le calcul de l'état : à jour, à mettre à jour,
// à retirer).

export interface Listing {
  vehicle_id: string;
  platform: string;
  vehicle_title: string;
  listing_url: string | null;
  fingerprint: string;
  published_at: string;
}

export function listListings() {
  return query<Listing>("SELECT * FROM vehicle_listings ORDER BY vehicle_title ASC, platform ASC");
}

export interface PublishedInput {
  vehicleId: string;
  platform: string;
  vehicleTitle: string;
  /** Adresse de l'annonce sur la plateforme ; null pour garder celle déjà enregistrée. */
  listingUrl: string | null;
  fingerprint: string;
}

/** Note qu'une annonce est publiée (ou vient d'être remise à jour) sur une plateforme. */
export function markListingPublished(input: PublishedInput) {
  return Effect.gen(function* () {
    if (!PLATFORMS.some((p) => p.key === input.platform)) return;
    yield* run(
      `INSERT INTO vehicle_listings (vehicle_id, platform, vehicle_title, listing_url, fingerprint)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(vehicle_id, platform) DO UPDATE SET
         vehicle_title = excluded.vehicle_title,
         listing_url = COALESCE(excluded.listing_url, vehicle_listings.listing_url),
         fingerprint = excluded.fingerprint,
         published_at = datetime('now')`,
      [input.vehicleId, input.platform, input.vehicleTitle, input.listingUrl?.slice(0, 500) || null, input.fingerprint]
    );
  });
}

/** Note qu'une annonce a été retirée d'une plateforme. */
export function removeListing(vehicleId: string, platform: string) {
  return run("DELETE FROM vehicle_listings WHERE vehicle_id = ? AND platform = ?", [vehicleId, platform]);
}

/**
 * Note que l'annonce du véhicule est publiée (ou remise à jour) sur une
 * plateforme, avec ses informations actuelles. Renvoie false si le
 * véhicule n'existe pas.
 */
export function publishVehicleListing(vehicleId: string, platform: string, listingUrl: string | null) {
  return Effect.gen(function* () {
    const vehicle = yield* getVehicle(vehicleId);
    if (!vehicle) return false;
    yield* markListingPublished({
      vehicleId,
      platform,
      vehicleTitle: vehicle.title,
      listingUrl,
      fingerprint: listingFingerprint(vehicle),
    });
    return true;
  });
}
