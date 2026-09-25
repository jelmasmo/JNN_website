import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Config du bundler. TanStack Start génère à la fois le client (React)
// et le serveur (fonctions appelées depuis le navigateur mais exécutées
// côté Cloudflare Worker, ex: lire/écrire dans la base D1).
export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tanstackStart({
      target: "cloudflare-module",
    }),
  ],
});
