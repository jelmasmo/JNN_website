import { createFileRoute } from "@tanstack/react-router";
import { robotsTxt } from "~/lib/seo";

// https://jnn-drogenbos.be/robots.txt — consignes aux moteurs de recherche.
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(robotsTxt(), {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
        }),
    },
  },
});
