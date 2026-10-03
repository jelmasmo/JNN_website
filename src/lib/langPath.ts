// Une adresse par langue : le français garde les adresses d'origine
// (/avis, /vehicules/…), le néerlandais et l'anglais sont préfixés
// (/nl/avis, /en/vehicules/…). Google peut ainsi trouver et proposer
// chaque version. Logique pure, testée dans tests/langPath.test.ts.

import { detectLang, type Lang } from "./i18n";

/** Adresse définitive du site (celle que Google doit retenir). */
export const SITE_URL = "https://jnn-drogenbos.be";

/** Langues servies sous un préfixe d'adresse (le français n'en a pas). */
const PREFIXED: readonly Lang[] = ["nl", "en"];

/** Code de langue annoncé à Google pour chaque version. */
const HREFLANG: Record<Lang, string> = { fr: "fr-BE", nl: "nl-BE", en: "en" };

/** « /nl/avis » → néerlandais, page « /avis » ; sans préfixe → français. */
export function splitLangPath(pathname: string): { lang: Lang; path: string } {
  const m = pathname.match(/^\/(nl|en)(\/.*)?$/);
  if (!m) return { lang: "fr", path: pathname || "/" };
  const rest = m[2] && m[2] !== "/" ? m[2] : "/";
  return { lang: m[1] as Lang, path: rest };
}

/** Pages qui existent en trois langues (pas l'admin ni les fichiers techniques). */
function isLocalized(path: string): boolean {
  if (path === "/admin" || path.startsWith("/admin/")) return false;
  if (path.startsWith("/_")) return false;
  // Fichiers à la racine (sitemap.xml, carte-jnn.jpg…) ; pas les fiches véhicules.
  return !/^\/[^/]+\.[a-z0-9]+$/i.test(path);
}

/** Adresse de la page `path` dans la langue `lang`. */
export function localizePath(path: string, lang: Lang): string {
  const { path: bare } = splitLangPath(path);
  if (lang === "fr" || !PREFIXED.includes(lang) || !isLocalized(bare)) return bare;
  return bare === "/" ? `/${lang}` : `/${lang}${bare}`;
}

/**
 * Adresse vers laquelle renvoyer un visiteur arrivé sur une page française
 * alors que son navigateur (ou son choix mémorisé) demande une autre langue ;
 * null s'il n'y a pas lieu de le rediriger.
 */
export function languageRedirect({
  pathname,
  acceptLanguage,
  cookie,
}: {
  pathname: string;
  acceptLanguage?: string | null;
  cookie?: string | null;
}): string | null {
  const { lang: urlLang, path } = splitLangPath(pathname);
  if (urlLang !== "fr" || !isLocalized(path)) return null;
  const wanted = detectLang({ acceptLanguage, cookie });
  return wanted === "fr" ? null : localizePath(path, wanted);
}

/** Les trois versions d'une page, à annoncer à Google (balises hreflang). */
export function alternateLinks(path: string): { hrefLang: string; href: string }[] {
  const langs: Lang[] = ["fr", "nl", "en"];
  return [
    ...langs.map((lang) => ({ hrefLang: HREFLANG[lang], href: absoluteUrl(path, lang) })),
    { hrefLang: "x-default", href: absoluteUrl(path, "fr") },
  ];
}

/** Adresse complète (https://jnn-drogenbos.be/…) de la page dans une langue. */
export function absoluteUrl(path: string, lang: Lang): string {
  return SITE_URL + localizePath(path, lang);
}

/**
 * Réécriture d'adresses pour le routeur (voir src/router.tsx) : les routes
 * ne connaissent que les chemins français ; le préfixe /nl ou /en est retiré
 * à l'entrée et remis à la sortie sur chaque lien, selon la langue de
 * l'adresse affichée (`currentHref`, avec son préfixe éventuel).
 */
export function langRewrite(currentHref: () => string | undefined) {
  const currentLang = (): Lang => {
    const href = currentHref() ?? (typeof window !== "undefined" ? window.location.pathname : "/");
    return splitLangPath(new URL(href, "http://jnn.local").pathname).lang;
  };
  return {
    input: ({ url }: { url: URL }) => {
      url.pathname = splitLangPath(url.pathname).path;
      return url;
    },
    output: ({ url }: { url: URL }) => {
      url.pathname = localizePath(url.pathname, currentLang());
      return url;
    },
  };
}
