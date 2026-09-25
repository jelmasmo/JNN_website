import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { listVehicles, listAllVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle, markVehicleSold } from "./vehicles";
import type { VehicleInput } from "./vehicles";
import { listReviews, listFeaturedReviews } from "./reviews";
import { runWithDb } from "./runtime";
import { checkCredentials, issueToken, verifyToken, setPassword, hashPassword } from "./auth";
import { uploadPhotoToR2, listSoldPhotos, addSoldPhoto, removeSoldPhoto } from "./photos";
import { bumpStat as bumpStatEffect, listStats } from "./stats";
import { getSettings, updateSettings } from "./settings";

// Fonctions serveur TanStack Start : appelées comme de simples fonctions
// async depuis les composants React, mais exécutées côté Worker
// Cloudflare, avec accès direct aux bindings définis dans wrangler.toml
// (D1 pour la base, R2 pour les photos).
interface CloudflareEnv {
  DB: D1Database;
  PHOTOS: R2Bucket;
  PHOTOS_PUBLIC_URL: string;
  ADMIN_SESSION_SECRET: string;
}
function cfEnv(): CloudflareEnv {
  return env as unknown as CloudflareEnv;
}
function db() {
  return cfEnv().DB;
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
    const originalId = data.originalId ?? data.vehicle.id;
    if (data.isNew || data.vehicle.id !== originalId) {
      const existing = await runWithDb(db(), getVehicle(data.vehicle.id));
      if (existing) {
        throw new Error(`La référence "${data.vehicle.id}" est déjà utilisée par un autre véhicule.`);
      }
    }
    if (data.isNew) {
      await runWithDb(db(), createVehicle(data.vehicle));
    } else {
      await runWithDb(db(), updateVehicle(originalId, data.vehicle));
    }
    return { ok: true };
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
