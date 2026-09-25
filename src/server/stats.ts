import { Effect } from "effect";
import { query, run } from "./db";

export interface VehicleStat {
  vehicle_id: string;
  views: number;
  contacts: number;
}

export function listStats() {
  return Effect.gen(function* () {
    return yield* query<VehicleStat>("SELECT * FROM vehicle_stats");
  });
}

export function bumpStat(vehicleId: string, field: "views" | "contacts") {
  return Effect.gen(function* () {
    yield* run(
      `INSERT INTO vehicle_stats (vehicle_id, ${field}) VALUES (?, 1)
       ON CONFLICT(vehicle_id) DO UPDATE SET ${field} = ${field} + 1`,
      [vehicleId]
    );
  });
}
