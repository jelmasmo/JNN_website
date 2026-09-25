import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Point d'entrée attendu par le plugin TanStack Start : il construit le
// routeur à partir de l'arborescence de routes générée automatiquement
// (routeTree.gen.ts) depuis les fichiers de src/routes/.
export function createRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
