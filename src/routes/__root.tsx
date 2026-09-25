import { createRootRoute, Outlet, HeadContent, Scripts } from "@tanstack/react-router";
import globalCss from "~/styles/global.css?url";

import { ToastHost } from "~/lib/toast";
import { getSiteSettings } from "~/server/functions";
import { SiteSettingsProvider, DEFAULT_SITE_SETTINGS } from "~/lib/siteSettings";

export const Route = createRootRoute({
  loader: async () => {
    try {
      return await getSiteSettings();
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "JNN — Véhicules d'occasion à Drogenbos" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Big+Shoulders+Text:wght@500;600;700&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap",
      },
      { rel: "stylesheet", href: globalCss },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const settings = Route.useLoaderData();
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        <SiteSettingsProvider value={settings}>
          <Outlet />
          <ToastHost />
        </SiteSettingsProvider>
        <Scripts />
      </body>
    </html>
  );
}
