import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { listVehicles } from "~/server/vehicles";
import { runWithDb } from "~/server/runtime";
import { sitemapXml } from "~/lib/seo";

// https://jnn-drogenbos.be/sitemap.xml — plan du site soumis à Google
// (Search Console) : accueil, avis et chaque véhicule encore en stock.
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const db = (env as unknown as { DB: D1Database }).DB;
        const vehicles = await runWithDb(db, listVehicles);
        return new Response(sitemapXml(vehicles.map((v) => v.id)), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
