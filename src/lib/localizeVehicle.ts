import { fuelLabel, gearboxLabel, type Lang } from "./i18n";
import type { VehicleView } from "~/server/vehicles";

/**
 * L'annonce telle qu'affichée dans la langue `lang` : textes libres traduits
 * automatiquement (s'ils existent, sinon le français d'origine), carburant
 * et boîte de vitesse traduits. Logique pure, testée dans
 * tests/localizeVehicle.test.ts.
 */
export function localizeVehicle(vehicle: VehicleView, lang: Lang): VehicleView {
  const tr = lang === "fr" ? undefined : vehicle.translations[lang];
  return {
    ...vehicle,
    sub: tr?.sub || vehicle.sub,
    color: tr?.color || vehicle.color,
    description: tr?.description || vehicle.description,
    options: tr && tr.options.length === vehicle.options.length ? tr.options : vehicle.options,
    fuel: fuelLabel(vehicle.fuel, lang),
    gearbox: gearboxLabel(vehicle.gearbox, lang),
  };
}
