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
  plugins: [
    tsConfigPaths(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
  ],
});
