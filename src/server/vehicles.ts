import { Effect } from "effect";
import { query } from "./db";

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
