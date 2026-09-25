// Crée (ou remplace) l'utilisateur admin en base, avec un mot de passe haché.
// Volontairement PAS dans une migration SQL committée sur GitHub : vos
// identifiants réels ne doivent jamais se retrouver dans l'historique git.
//
// Usage (en local, une fois la base créée) :
//   ADMIN_USER=JNN1620 ADMIN_PASS=votre_mot_de_passe node scripts/create-admin.mjs --local
//   ADMIN_USER=JNN1620 ADMIN_PASS=votre_mot_de_passe node scripts/create-admin.mjs --remote
//
// Le script calcule un hash scrypt (jamais le mot de passe en clair) et
// exécute l'INSERT directement via `wrangler d1 execute`.

import { scryptSync, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";

const user = process.env.ADMIN_USER;
const pass = process.env.ADMIN_PASS;
const mode = process.argv.includes("--remote") ? "--remote" : "--local";

if (!user || !pass) {
  console.error("Définissez ADMIN_USER et ADMIN_PASS avant de lancer ce script.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const derived = scryptSync(pass, salt, 64).toString("hex");
const hash = `scrypt$${salt}$${derived}`;

const sql = `
  DELETE FROM admin_users WHERE username = '${user.replace(/'/g, "''")}';
  INSERT INTO admin_users (username, password_hash) VALUES ('${user.replace(/'/g, "''")}', '${hash}');
`;

execFileSync(
  "npx",
  ["wrangler", "d1", "execute", "jnn-db", mode, "--command", sql],
  { stdio: "inherit" }
);

console.log(`Identifiant admin "${user}" créé/mis à jour (${mode}).`);
