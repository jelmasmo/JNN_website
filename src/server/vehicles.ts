import { Effect } from "effect";
import { query, run } from "./db";

export interface Vehicle {
  id: string;
  title: string;
  sub: string | null;
  type: string;
  first_reg: string | null;
  km: number;
  fuel: string | null;
  gearbox: string | null;
  kw: number | null;
  color: string | null;
  price: number;
  description: string | null;
  options_json: string;
  images_json: string;
  position: number;
  sold_at: string | null;
}

export interface VehicleView extends Omit<Vehicle, "options_json" | "images_json"> {
  options: string[];
  images: string[];
}

function toView(v: Vehicle): VehicleView {
  const { options_json, images_json, ...rest } = v;
  return {
    ...rest,
    options: JSON.parse(options_json || "[]"),
    images: JSON.parse(images_json || "[]"),
  };
}

/** Liste les véhicules encore en stock (non vendus), triés pour l'affichage. */
export const listVehicles = Effect.gen(function* () {
  const rows = yield* query<Vehicle>(
    "SELECT * FROM vehicles WHERE sold_at IS NULL ORDER BY position ASC"
  );
  return rows.map(toView);
});

/** Récupère un véhicule précis par son id, ou `null` s'il n'existe pas. */
export function getVehicle(id: string) {
  return Effect.gen(function* () {
    const rows = yield* query<Vehicle>("SELECT * FROM vehicles WHERE id = ?", [id]);
    return rows[0] ? toView(rows[0]) : null;
  });
}

/** Liste TOUS les véhicules (y compris vendus) — pour l'espace admin. */
export const listAllVehicles = Effect.gen(function* () {
  const rows = yield* query<Vehicle>("SELECT * FROM vehicles ORDER BY position ASC");
  return rows.map(toView);
});

export interface VehicleInput {
  id: string;
  title: string;
  sub: string;
  type: string;
  first_reg: string;
  km: number;
  fuel: string;
  gearbox: string;
  kw: number;
  color: string;
  price: number;
  description: string;
  options: string[];
  images: string[];
}

/** Crée un nouveau véhicule (place en fin de liste). */
export function createVehicle(input: VehicleInput) {
  return Effect.gen(function* () {
    const rows = yield* query<{ n: number }>("SELECT COALESCE(MAX(position), -1) + 1 AS n FROM vehicles");
    const position = rows[0]?.n ?? 0;
    yield* run(
      `INSERT INTO vehicles
        (id, title, sub, type, first_reg, km, fuel, gearbox, kw, color, price, description, options_json, images_json, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id, input.title, input.sub, input.type, input.first_reg, input.km,
        input.fuel, input.gearbox, input.kw, input.color, input.price, input.description,
        JSON.stringify(input.options), JSON.stringify(input.images), position,
      ]
    );
  });
}

/**
 * Met à jour un véhicule existant (ne change pas sa position). `originalId`
 * est la référence AVANT modification — nécessaire car la référence
 * elle-même est modifiable.
 *
 * Cas courant (référence inchangée) : simple UPDATE du contenu.
 *
 * Cas renommage : on ne touche JAMAIS directement à `vehicles.id` par un
 * UPDATE — `vehicle_stats.vehicle_id` la référence par clé étrangère, et
 * D1/SQLite refuse un UPDATE de la clé primaire référencée ailleurs (erreur
 * FOREIGN KEY constraint failed), même pour la réécrire avec la même
 * valeur. On insère donc une nouvelle ligne sous le nouvel id, on bascule
 * les stats vers cette nouvelle référence, puis on supprime l'ancienne
 * ligne (elle n'a alors plus aucune ligne enfant qui pointe vers elle).
 */
export function updateVehicle(originalId: string, input: VehicleInput) {
  return Effect.gen(function* () {
    if (input.id === originalId) {
      yield* run(
        `UPDATE vehicles SET
          title=?, sub=?, type=?, first_reg=?, km=?, fuel=?, gearbox=?, kw=?, color=?,
          price=?, description=?, options_json=?, images_json=?, updated_at=datetime('now')
         WHERE id=?`,
        [
          input.title, input.sub, input.type, input.first_reg, input.km, input.fuel,
          input.gearbox, input.kw, input.color, input.price, input.description,
          JSON.stringify(input.options), JSON.stringify(input.images), originalId,
        ]
      );
      return;
    }

    const rows = yield* query<{ position: number; sold_at: string | null; created_at: string }>(
      "SELECT position, sold_at, created_at FROM vehicles WHERE id = ?",
      [originalId]
    );
    const existingRow = rows[0];
    if (!existingRow) {
      throw new Error(`Véhicule "${originalId}" introuvable.`);
    }
    yield* run(
      `INSERT INTO vehicles
        (id, title, sub, type, first_reg, km, fuel, gearbox, kw, color, price, description, options_json, images_json, position, sold_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        input.id, input.title, input.sub, input.type, input.first_reg, input.km, input.fuel,
        input.gearbox, input.kw, input.color, input.price, input.description,
        JSON.stringify(input.options), JSON.stringify(input.images),
        existingRow.position, existingRow.sold_at, existingRow.created_at,
      ]
    );
    yield* run("UPDATE vehicle_stats SET vehicle_id = ? WHERE vehicle_id = ?", [input.id, originalId]);
    yield* run("DELETE FROM vehicles WHERE id = ?", [originalId]);
  });
}

export function deleteVehicle(id: string) {
  return Effect.gen(function* () {
    yield* run("DELETE FROM vehicle_stats WHERE vehicle_id = ?", [id]);
    yield* run("DELETE FROM vehicles WHERE id = ?", [id]);
  });
}

/** Marque un véhicule comme vendu (il disparaît du stock public). */
export function markVehicleSold(id: string) {
  return Effect.gen(function* () {
    yield* run("UPDATE vehicles SET sold_at = datetime('now') WHERE id = ?", [id]);
  });
}
