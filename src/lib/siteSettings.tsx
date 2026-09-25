import { createContext, useContext, type ReactNode } from "react";

// Coordonnées de contact modifiables depuis l'admin (téléphone, e-mail,
// adresse) — chargées une fois dans le loader racine (voir __root.tsx) et
// distribuées via ce contexte, pour que Header/Footer/BizCardSection et
// les pages n'aient pas chacun à les recharger.
export interface SiteSettings {
  phone: string;
  email: string;
  address: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  phone: "+32 470 00 00 00",
  email: "JNN1620@outlook.com",
  address: "Grote Baan 361/1, 1620 Drogenbos",
};

const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SITE_SETTINGS);

export function SiteSettingsProvider({ value, children }: { value: SiteSettings; children: ReactNode }) {
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}
