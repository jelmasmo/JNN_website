import { createServerFn } from "@tanstack/react-start";
import { listVehicles, getVehicle } from "./vehicles";
import { listReviews, listFeaturedReviews } from "./reviews";
import { runWithDb } from "./runtime";

// Fonctions serveur TanStack Start : appelées comme de simples fonctions
// async depuis les composants React, mais exécutées côté Worker
// Cloudflare, avec accès direct au binding D1 (`process.env.DB`).
// C'est ce qui remplace les lectures/écritures `localStorage` du prototype.

export const getVehiclesList = createServerFn({ method: "GET" }).handler(async () => {
  const db = (process.env as unknown as { DB: D1Database }).DB;
  return runWithDb(db, listVehicles);
});

export const getVehicleById = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const db = (process.env as unknown as { DB: D1Database }).DB;
    return runWithDb(db, getVehicle(id));
  });

export const getAllReviews = createServerFn({ method: "GET" }).handler(async () => {
  const db = (process.env as unknown as { DB: D1Database }).DB;
  return runWithDb(db, listReviews);
});

export const getFeaturedReviews = createServerFn({ method: "GET" }).handler(async () => {
  const db = (process.env as unknown as { DB: D1Database }).DB;
  return runWithDb(db, listFeaturedReviews);
});
