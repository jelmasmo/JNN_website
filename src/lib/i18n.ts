// Langue d'affichage du site public : français, néerlandais ou anglais.
// Logique pure, testée dans tests/i18n.test.ts.

import { fr, nl, en, type MessageKey } from "./messages";

export const LANGS = ["fr", "nl", "en"] as const;
export type Lang = (typeof LANGS)[number];

function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/**
 * Langues demandées par le navigateur (en-tête Accept-Language), de la plus
 * à la moins souhaitée — « nl-BE » compte comme « nl ».
 */
function preferredLanguages(acceptLanguage: string): string[] {
  return acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { base: tag.trim().toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) : 1, index };
    })
    .filter((l) => l.base && !Number.isNaN(l.q))
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map((l) => l.base);
}

/** Cookie où est mémorisé le choix fait avec le sélecteur de langue. */
export const LANG_COOKIE = "jnn-lang";

/** Cookie (document.cookie) qui mémorise pendant un an la langue choisie avec le sélecteur. */
export function langCookie(lang: Lang): string {
  return `${LANG_COOKIE}=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function langFromCookie(cookie: string): Lang | null {
  for (const part of cookie.split(";")) {
    const [name, value] = part.trim().split("=");
    if (name === LANG_COOKIE && value && isLang(value)) return value;
  }
  return null;
}

/**
 * Langue à afficher : celle choisie avec le sélecteur (cookie) si le
 * visiteur en a choisi une, sinon la première des trois langues du site
 * demandée par son navigateur, sinon l'anglais. Une requête sans aucune
 * langue (robots qui préparent l'aperçu d'un lien WhatsApp ou Facebook,
 * moteurs de recherche) reçoit le français, la langue d'origine du site.
 */
export function detectLang({ acceptLanguage, cookie }: { acceptLanguage?: string | null; cookie?: string | null }): Lang {
  const chosen = langFromCookie(cookie ?? "");
  if (chosen) return chosen;
  const wanted = preferredLanguages(acceptLanguage ?? "");
  if (wanted.length === 0) return "fr";
  return wanted.find(isLang) ?? "en";
}

const MESSAGES = { fr, nl, en } satisfies Record<Lang, Record<MessageKey, string>>;

/** Texte `key` dans la langue `lang`, où chaque « {nom} » est remplacé par `params.nom`. */
export function t(lang: Lang, key: MessageKey, params: Record<string, string | number> = {}): string {
  return MESSAGES[lang][key].replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole
  );
}

/** Carburant d'une annonce (valeur française de la liste de l'admin) dans la langue affichée. */
export function fuelLabel(value: string | null, lang: Lang): string {
  return fixedValue("fuel", value, lang);
}

/** Boîte de vitesse d'une annonce (valeur française de l'admin) dans la langue affichée. */
export function gearboxLabel(value: string | null, lang: Lang): string {
  return fixedValue("gearbox", value, lang);
}

function fixedValue(kind: "fuel" | "gearbox", value: string | null, lang: Lang): string {
  const key = `${kind}.${value}` as MessageKey;
  return key in MESSAGES[lang] ? t(lang, key) : (value ?? "");
}
