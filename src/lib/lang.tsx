import { createContext, useCallback, useContext, type ReactNode } from "react";
import { t, type Lang } from "./i18n";
import type { MessageKey } from "./messages";

// Langue du visiteur, déterminée côté serveur dans le loader racine (voir
// __root.tsx : langue lue dans l'adresse, voir langPath.ts) puis distribuée à toute la page via ce
// contexte — comme les coordonnées de contact (siteSettings.tsx).
const LangContext = createContext<Lang>("fr");

export function LangProvider({ value, children }: { value: Lang; children: ReactNode }) {
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

/** Fonction de traduction liée à la langue du visiteur : `const tr = useT(); tr("nav.stock")`. */
export function useT(): (key: MessageKey, params?: Record<string, string | number>) => string {
  const lang = useLang();
  return useCallback((key, params) => t(lang, key, params), [lang]);
}
