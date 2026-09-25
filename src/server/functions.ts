import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { listVehicles, getVehicle } from "./vehicles";
import { listReviews, listFeaturedReviews } from "./reviews";
import { runWithDb } from "./runtime";

// Fonctions serveur TanStack Start : appelées comme de simples fonctions
// async depuis les composants React, mais exécutées côté Worker
// Cloudflare, avec accès direct au binding D1 défini dans wrangler.toml.
// C'est ce qui remplace les lectures/écritures `localStorage` du prototype.
function db() {
  return (env as unknown as { DB: D1Database }).DB;
}

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
