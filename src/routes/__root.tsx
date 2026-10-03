import { createRootRoute, Outlet, HeadContent, Scripts, redirect } from "@tanstack/react-router";
import globalCss from "~/styles/global.css?url";

import { ToastHost } from "~/lib/toast";
import { getSiteSettings, getLanguageRedirect } from "~/server/functions";
import { SiteSettingsProvider, DEFAULT_SITE_SETTINGS } from "~/lib/siteSettings";
import { LangProvider } from "~/lib/lang";
import { t, type Lang } from "~/lib/i18n";
import { dealerJsonLd } from "~/lib/seo";
import { splitLangPath, absoluteUrl, alternateLinks } from "~/lib/langPath";

/** Valeur de l'attribut <html lang> et de og:locale pour chaque langue du site. */
const HTML_LANG: Record<Lang, string> = { fr: "fr-BE", nl: "nl-BE", en: "en" };
const OG_LOCALE: Record<Lang, string> = { fr: "fr_BE", nl: "nl_BE", en: "en_GB" };

export const Route = createRootRoute({
  // La langue est celle de l'adresse : /nl/… en néerlandais, /en/… en
  // anglais, sans préfixe en français (voir src/lib/langPath.ts et la
  // réécriture d'adresses de src/router.tsx). Un visiteur qui arrive sur une
  // page française alors que son navigateur (ou son choix mémorisé) demande
  // une autre langue est d'abord renvoyé vers la bonne version — seulement
  // au chargement de la page côté serveur, jamais pendant la navigation.
  beforeLoad: async ({ location }) => {
    if (typeof window !== "undefined") return;
    const target = await getLanguageRedirect({ data: publicPathname(location.publicHref) }).catch(() => null);
    if (target) throw redirect({ href: target + (location.searchStr ?? ""), statusCode: 302 });
  },
  loader: async ({ location }) => {
    const { lang, path } = splitLangPath(publicPathname(location.publicHref));
    const settings = await getSiteSettings().catch(() => DEFAULT_SITE_SETTINGS);
    return { settings, lang, path };
  },
  // staleTime 0 : sans ça, la route racine réutilise ses données déjà
  // chargées lors des navigations côté client, donc une modification des
  // coordonnées dans l'admin ne se voyait pas ailleurs sur le site sans
  // rechargement complet de la page.
  staleTime: 0,
  head: ({ loaderData }) => {
    const lang = loaderData?.lang ?? "fr";
    const path = loaderData?.path ?? "/";
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: t(lang, "meta.title") },
        { name: "description", content: t(lang, "meta.description") },
        // Aperçu des liens partagés (WhatsApp, Facebook…) : l'image de la
        // carte de visite JNN (public/carte-jnn.jpg, 1200×630).
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "JNN Drogenbos" },
        { property: "og:title", content: t(lang, "meta.ogTitle") },
        { property: "og:description", content: t(lang, "meta.ogDescription") },
        { property: "og:locale", content: OG_LOCALE[lang] },
        { property: "og:url", content: absoluteUrl(path, lang) },
        { property: "og:image", content: "https://jnn-drogenbos.be/carte-jnn.jpg" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: t(lang, "meta.ogImageAlt") },
        { name: "twitter:card", content: "summary_large_image" },
        // Fiche « garage » lue par Google (nom, adresse, téléphone) : aide
        // à relier le site à JNN dans les résultats de recherche locaux.
        { "script:ld+json": dealerJsonLd(loaderData?.settings ?? DEFAULT_SITE_SETTINGS) },
      ],
      links: [
        // Adresse de référence de la page et ses versions dans les autres
        // langues, pour que Google propose à chacun la bonne version.
        { rel: "canonical", href: absoluteUrl(path, lang) },
        ...alternateLinks(path).map((a) => ({ rel: "alternate", hrefLang: a.hrefLang, href: a.href })),
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Big+Shoulders+Text:wght@500;600;700;800&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&family=Manrope:wght@500;600;700&display=swap",
        },
        { rel: "stylesheet", href: globalCss },
      ],
    };
  },
  component: RootComponent,
});

function RootComponent() {
  const { settings, lang } = Route.useLoaderData();
  return (
    <html lang={HTML_LANG[lang]}>
      <head>
        <HeadContent />
      </head>
      <body>
        <LangProvider value={lang}>
          <SiteSettingsProvider value={settings}>
            <Outlet />
            <ToastHost />
          </SiteSettingsProvider>
        </LangProvider>
        <Scripts />
      </body>
    </html>
  );
}

/** Chemin de l'adresse réelle (avec son préfixe de langue éventuel). */
function publicPathname(publicHref: string): string {
  return new URL(publicHref, "http://jnn.local").pathname;
}
