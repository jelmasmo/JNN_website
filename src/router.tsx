import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { NotFound } from "./components/NotFound";

// Point d'entrée attendu par TanStack Start (le nom "getRouter" est imposé
// par le framework — voir l'import généré dans routeTree.gen.ts) : il
// construit le routeur à partir de l'arborescence de routes générée
// automatiquement depuis les fichiers de src/routes/.
export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    // Page 404 aux couleurs de JNN pour toute adresse inconnue.
    defaultNotFoundComponent: () => <NotFound />,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
