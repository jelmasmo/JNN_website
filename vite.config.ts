import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";

// Config du bundler. TanStack Start génère à la fois le client (React)
// et le serveur (fonctions appelées depuis le navigateur mais exécutées
// côté Cloudflare Worker, ex: lire/écrire dans la base D1).
//
// Le plugin `cloudflare()` fait tourner ce Worker (bindings compris,
// dont la base D1) sous Miniflare même en `vite dev` — sans lui, les
// fonctions serveur ne voient aucune base de données en local.
//
// "cloudflare:workers" est un module virtuel fourni par le runtime
// Cloudflare (pas un vrai paquet npm) : on l'exclut du pré-bundling
// client (optimizeDeps) et de l'empaquetage Rollup (rollupOptions.external).
// Le plugin Cloudflare refuse en revanche qu'on touche à `ssr.external` /
// `resolve.external` pour SON PROPRE environnement "ssr" — il gère ça
// lui-même — donc on ne configure que ce qu'il autorise.
export default defineConfig({
  optimizeDeps: {
    exclude: ["cloudflare:workers"],
  },
  build: {
    rollupOptions: {
      external: ["cloudflare:workers"],
    },
  },
  plugins: [
    tsConfigPaths(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    react(),
  ],
});
