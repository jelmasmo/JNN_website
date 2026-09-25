import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tsConfigPaths from "vite-tsconfig-paths";

// Config du bundler. TanStack Start génère à la fois le client (React)
// et le serveur (fonctions appelées depuis le navigateur mais exécutées
// côté Cloudflare Worker, ex: lire/écrire dans la base D1).
//
// Le plugin `cloudflare()` fait tourner ce Worker (bindings compris,
// dont la base D1) sous Miniflare même en `vite dev` — sans lui, les
// fonctions serveur ne voient aucune base de données en local.
export default defineConfig({
  // "cloudflare:workers" est un module virtuel fourni par le runtime
  // Cloudflare — il n'existe pas comme paquet npm, donc on dit à Vite de
  // ne jamais essayer de le pré-bundler ou de l'empaqueter avec Rollup
  // (sinon : "Failed to resolve dependency/import: cloudflare:workers").
  // Sans ce dernier réglage, toute page qui appelle une fonction serveur
  // (donc quasiment toutes) plantait silencieusement pendant le rendu
  // côté serveur — d'où les 404 vides qu'on observait.
  optimizeDeps: {
    exclude: ["cloudflare:workers"],
  },
  ssr: {
    external: ["cloudflare:workers"],
  },
  build: {
    rollupOptions: {
      external: ["cloudflare:workers"],
    },
  },
  environments: {
    ssr: {
      build: {
        rollupOptions: {
          external: ["cloudflare:workers"],
        },
      },
    },
  },
  plugins: [
    tsConfigPaths(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
  ],
});
