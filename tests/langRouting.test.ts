import { describe, it, expect } from "vitest";
import { createRouter, createRootRoute, createRoute, createMemoryHistory } from "@tanstack/react-router";
import { langRewrite } from "~/lib/langPath";

// Vrai routeur TanStack avec les mêmes chemins que le site, pour vérifier
// que les adresses /nl et /en arrivent sur les bonnes pages et que les liens
// générés gardent la langue de la page en cours.
function siteRouter(url: string) {
  const root = createRootRoute();
  const routes = [
    createRoute({ getParentRoute: () => root, path: "/" }),
    createRoute({ getParentRoute: () => root, path: "/avis" }),
    createRoute({ getParentRoute: () => root, path: "/vehicules/$vehicleId" }),
    createRoute({ getParentRoute: () => root, path: "/admin/dashboard" }),
  ];
  let current: () => string | undefined = () => undefined;
  const router = createRouter({
    routeTree: root.addChildren(routes),
    history: createMemoryHistory({ initialEntries: [url] }),
    rewrite: langRewrite(() => current()),
  });
  current = () => router.latestLocation?.publicHref;
  return router;
}

describe("adresses par langue dans le routeur", () => {
  it("affiche la fiche véhicule quand on ouvre son adresse néerlandaise", async () => {
    const router = siteRouter("/nl/vehicules/Mini%20Cooper%20bleu");
    await router.load();
    const match = router.state.matches.at(-1)!;
    expect(match.routeId).toBe("/vehicules/$vehicleId");
    expect(match.params).toEqual({ vehicleId: "Mini Cooper bleu" });
  });

  it("affiche l'accueil pour /en", async () => {
    const router = siteRouter("/en");
    await router.load();
    expect(router.state.matches.at(-1)!.routeId).toBe("/");
  });

  it("garde le néerlandais dans les liens d'une page néerlandaise", async () => {
    const router = siteRouter("/nl/avis");
    await router.load();
    expect(router.buildLocation({ to: "/vehicules/$vehicleId", params: { vehicleId: "A1-21" } }).publicHref).toBe(
      "/nl/vehicules/A1-21"
    );
    expect(router.buildLocation({ to: "/" }).publicHref).toBe("/nl");
  });

  it("laisse les liens d'une page française sans préfixe", async () => {
    const router = siteRouter("/vehicules/A1-21");
    await router.load();
    expect(router.buildLocation({ to: "/avis" }).publicHref).toBe("/avis");
  });

  it("ne préfixe jamais les liens vers l'espace professionnel", async () => {
    const router = siteRouter("/en/avis");
    await router.load();
    expect(router.buildLocation({ to: "/admin/dashboard" }).publicHref).toBe("/admin/dashboard");
  });
});
