import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeader } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import {
  listVehicles,
  listAllVehicles,
  getVehicle,
  saveVehicle,
  deleteVehicle,
  markVehicleSold,
  translateMissingVehicles,
} from "./vehicles";
import { workersAiTranslator } from "./workersAiTranslator";
import { languageRedirect } from "~/lib/langPath";
import type { VehicleInput } from "./vehicles";
import { listReviews, listFeaturedReviews } from "./reviews";
import { runWithDb } from "./runtime";
import { checkCredentials, issueToken, verifyToken, setPassword, hashPassword } from "./auth";
import { uploadPhotoToR2, listSoldPhotos, addSoldPhoto, removeSoldPhoto } from "./photos";
import { bumpStat as bumpStatEffect, listStats } from "./stats";
import { getSettings, updateSettings } from "./settings";
import { listListings, publishVehicleListing, removeListing } from "./listings";
import { recordVisit as recordVisitEffect, visitReport, type VisitEventType } from "./visits";

// Fonctions serveur TanStack Start : appelées comme de simples fonctions
// async depuis les composants React, mais exécutées côté Worker
// Cloudflare, avec accès direct aux bindings définis dans wrangler.toml
// (D1 pour la base, R2 pour les photos).
interface CloudflareEnv {
  DB: D1Database;
  PHOTOS: R2Bucket;
  PHOTOS_PUBLIC_URL: string;
  ADMIN_SESSION_SECRET: string;
  AI: Ai;
}
function cfEnv(): CloudflareEnv {
  return env as unknown as CloudflareEnv;
}
function db() {
  return cfEnv().DB;
}
function translator() {
  return workersAiTranslator(cfEnv().AI);
}

/** Lève une erreur si le jeton admin fourni n'est pas valide. */
async function assertAdmin(token: string | undefined | null): Promise<void> {
  const secret = cfEnv().ADMIN_SESSION_SECRET;
  const username = secret ? await verifyToken(secret, token) : null;
  if (!username) {
    throw new Error("Non autorisé — reconnectez-vous à l'espace professionnel.");
  }
}

/* ---------- PUBLIC : véhicules & avis ---------- */

export const getVehiclesList = createServerFn({ method: "GET" }).handler(async () => {
  return runWithDb(db(), listVehicles);
});

export const getVehicleById = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    return runWithDb(db(), getVehicle(id));
  });

export const getAllReviews = createServerFn({ method: "GET" }).handler(async () => {
  return runWithDb(db(), listReviews);
});

export const getFeaturedReviews = createServerFn({ method: "GET" }).handler(async () => {
  return runWithDb(db(), listFeaturedReviews);
});

/**
 * Adresse vers laquelle renvoyer un visiteur arrivé sur une page française
 * alors que son choix mémorisé (cookie du sélecteur) ou son navigateur
 * demande le néerlandais ou l'anglais ; null sinon (voir languageRedirect).
 */
export const getLanguageRedirect = createServerFn({ method: "GET" })
  .validator((pathname: string) => pathname)
  .handler(async ({ data: pathname }) => {
    return languageRedirect({
      pathname,
      acceptLanguage: getRequestHeader("accept-language"),
      cookie: getRequestHeader("cookie"),
    });
  });

/** Coordonnées de contact (téléphone, e-mail, adresse) — lecture publique. */
export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  return runWithDb(db(), getSettings);
});

export const recordVehicleEvent = createServerFn({ method: "POST" })
  .validator((data: { vehicleId: string; field: "views" | "contacts" }) => data)
  .handler(async ({ data }) => {
    await runWithDb(db(), bumpStatEffect(data.vehicleId, data.field));
    return { ok: true };
  });

/**
 * Enregistre une page vue ou une prise de contact pour le rapport de
 * provenance (voir ./visits.ts). La ville et le pays sont l'estimation
 * fournie par Cloudflare pour la requête ; aucune adresse IP n'est gardée.
 */
export const recordVisit = createServerFn({ method: "POST" })
  .validator(
    (data: {
      eventType: VisitEventType;
      vehicleId: string | null;
      path: string;
      referrer: string;
      src: string | null;
      isEntry: boolean;
    }) => data
  )
  .handler(async ({ data }) => {
    const request = getRequest();
    const cf = (request as unknown as { cf?: { country?: string; city?: string; region?: string } }).cf;
    await runWithDb(
      db(),
      recordVisitEffect({
        ...data,
        siteHost: new URL(request.url).hostname,
        country: cf?.country ?? getRequestHeader("cf-ipcountry") ?? null,
        city: cf?.city ?? null,
        region: cf?.region ?? null,
      })
    );
    return { ok: true };
  });

/* ---------- ADMIN : connexion ---------- */

export const adminLogin = createServerFn({ method: "POST" })
  .validator((data: { username: string; password: string }) => data)
  .handler(async ({ data }) => {
    const username = await runWithDb(db(), checkCredentials(data.username, data.password));
    if (!username) return { ok: false as const, error: "Identifiant ou mot de passe incorrect." };
    const secret = cfEnv().ADMIN_SESSION_SECRET;
    if (!secret) {
      return { ok: false as const, error: "Configuration serveur incomplète (ADMIN_SESSION_SECRET manquant)." };
    }
    const token = await issueToken(secret, username);
    return { ok: true as const, token, username };
  });

export const adminCheckToken = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const secret = cfEnv().ADMIN_SESSION_SECRET;
    const username = secret ? await verifyToken(secret, data.token) : null;
    return { valid: !!username, username };
  });

export const adminChangePassword = createServerFn({ method: "POST" })
  .validator((data: { token: string; newUsername: string; newPassword: string }) => data)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const hash = hashPassword(data.newPassword);
    await runWithDb(db(), setPassword(data.newUsername, hash));
    const secret = cfEnv().ADMIN_SESSION_SECRET;
    const token = await issueToken(secret, data.newUsername);
    return { ok: true, token };
  });

/* ---------- ADMIN : véhicules ---------- */

export const adminListVehicles = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    return runWithDb(db(), listAllVehicles);
  });

export const adminSaveVehicle = createServerFn({ method: "POST" })
  .validator((data: { token: string; isNew: boolean; originalId?: string; vehicle: VehicleInput }) => data)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    await runWithDb(db(), saveVehicle(data, translator()));
    return { ok: true };
  });

/** Traduit en néerlandais et en anglais les annonces qui ne le sont pas encore. */
export const adminTranslateVehicles = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const count = await runWithDb(db(), translateMissingVehicles(translator()));
    return { count };
  });

export const adminDeleteVehicle = createServerFn({ method: "POST" })
  .validator((data: { token: string; id: string }) => data)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    await runWithDb(db(), deleteVehicle(data.id));
    return { ok: true };
  });

export const adminMarkSold = createServerFn({ method: "POST" })
  .validator((data: { token: string; id: string }) => data)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    await runWithDb(db(), markVehicleSold(data.id));
    return { ok: true };
  });

export const adminGetStats = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    return runWithDb(db(), listStats());
  });

/** Rapport de provenance des `days` derniers jours, pour le tableau de bord. */
export const adminGetVisitReport = createServerFn({ method: "POST" })
  .validator((data: { token: string; days: number }) => data)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    return runWithDb(db(), visitReport(data.days));
  });

/* ---------- ADMIN : diffusion des annonces sur les plateformes ---------- */

export const adminListListings = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    return runWithDb(db(), listListings());
  });

/** Note l'annonce comme publiée (ou remise à jour) sur une plateforme. */
export const adminPublishListing = createServerFn({ method: "POST" })
  .validator((data: { token: string; vehicleId: string; platform: string; listingUrl: string | null }) => data)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const ok = await runWithDb(db(), publishVehicleListing(data.vehicleId, data.platform, data.listingUrl));
    if (!ok) throw new Error("Ce véhicule n'existe plus.");
    return { ok: true };
  });

/** Note l'annonce comme retirée d'une plateforme. */
export const adminRemoveListing = createServerFn({ method: "POST" })
  .validator((data: { token: string; vehicleId: string; platform: string }) => data)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    await runWithDb(db(), removeListing(data.vehicleId, data.platform));
    return { ok: true };
  });

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .validator((data: { token: string; phone: string; email: string; address: string }) => data)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    await runWithDb(db(), updateSettings({ phone: data.phone, email: data.email, address: data.address }));
    return { ok: true };
  });

/* ---------- ADMIN : photos (véhicules + panorama "vendus") ---------- */
// FormData car ce sont de vrais fichiers envoyés depuis le formulaire —
// pas du JSON. Le jeton admin voyage comme champ du formulaire.

export const adminUploadPhoto = createServerFn({ method: "POST" })
  .validator((formData: FormData) => formData)
  .handler(async ({ data: formData }) => {
    const token = formData.get("token");
    await assertAdmin(typeof token === "string" ? token : null);
    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("Aucun fichier reçu.");
    const kind = formData.get("kind") === "sold" ? "sold" : "vehicles";
    const { PHOTOS, PHOTOS_PUBLIC_URL } = cfEnv();
    if (!PHOTOS_PUBLIC_URL || PHOTOS_PUBLIC_URL.startsWith("REMPLACER")) {
      throw new Error("PHOTOS_PUBLIC_URL n'est pas configurée dans wrangler.toml.");
    }
    const url = await uploadPhotoToR2(PHOTOS, PHOTOS_PUBLIC_URL, file, kind);
    return { url };
  });

export const adminListSoldPhotos = createServerFn({ method: "GET" }).handler(async () => {
  return runWithDb(db(), listSoldPhotos());
});

export const adminAddSoldPhoto = createServerFn({ method: "POST" })
  .validator((data: { token: string; url: string; position: number }) => data)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    await runWithDb(db(), addSoldPhoto(data.url, data.position));
    return { ok: true };
  });

export const adminRemoveSoldPhoto = createServerFn({ method: "POST" })
  .validator((data: { token: string; id: number }) => data)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    await runWithDb(db(), removeSoldPhoto(data.id));
    return { ok: true };
  });
