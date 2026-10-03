import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { NotFound } from "./components/NotFound";
import { langRewrite } from "./lib/langPath";

// Point d'entrée attendu par TanStack Start (le nom "getRouter" est imposé
// par le framework — voir l'import généré dans routeTree.gen.ts) : il
// construit le routeur à partir de l'arborescence de routes générée
// automatiquement depuis les fichiers de src/routes/.
export function getRouter() {
  // Adresse réellement affichée (avec /nl ou /en) de la page en cours : sert
  // à garder la même langue dans tous les liens générés par le routeur.
  let currentPublicHref: () => string | undefined = () => undefined;
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    // Page 404 aux couleurs de JNN pour toute adresse inconnue.
    defaultNotFoundComponent: () => <NotFound />,
    // Une adresse par langue (voir src/lib/langPath.ts) : les routes ne
    // connaissent que les chemins français (/avis, /vehicules/…) ; le préfixe
    // /nl ou /en est retiré à l'entrée et remis sur chaque lien à la sortie.
    rewrite: langRewrite(() => currentPublicHref()),
  });
  currentPublicHref = () => router.latestLocation?.publicHref;
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
