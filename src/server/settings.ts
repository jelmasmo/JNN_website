import { Effect } from "effect";
import { query, run } from "./db";

export interface SiteSettingsRow {
  phone: string;
  email: string;
  address: string;
}

const FALLBACK: SiteSettingsRow = {
  phone: "+32 470 00 00 00",
  email: "JNN1620@outlook.com",
  address: "Grote Baan 361/1, 1620 Drogenbos",
};

/** Coordonnées de contact (numéro, e-mail, adresse) — modifiables depuis l'admin. */
export const getSettings = Effect.gen(function* () {
  const rows = yield* query<SiteSettingsRow>("SELECT phone, email, address FROM site_settings WHERE id = 1");
  return rows[0] ?? FALLBACK;
});

export function updateSettings(input: SiteSettingsRow) {
  return Effect.gen(function* () {
    yield* run("UPDATE site_settings SET phone = ?, email = ?, address = ? WHERE id = 1", [
      input.phone,
      input.email,
      input.address,
    ]);
  });
}
