# JNN — Site vitrine (véhicules d'occasion, Drogenbos)

Stack : **TanStack Start** (React + rendu serveur) + **Effect** (logique
serveur) + **Cloudflare D1** (base de données) + **Cloudflare Pages**
(hébergement) + **Wrangler** (outil en ligne de commande Cloudflare).

## Étape 1 — Installer les dépendances (chez vous, en local)

```bash
npm install
```

## Étape 2 — Lancer les tests (TDD)

```bash
npm test
```

Le premier test (`tests/power.test.ts`) vérifie la conversion kW → chevaux
utilisée sur les fiches véhicules — écrit avant même que la fonction
existe, pour garantir que le calcul reste toujours correct.

## Étape 3 — Créer votre compte Cloudflare et connecter Wrangler

```bash
npx wrangler login
```

Une page de connexion s'ouvre dans votre navigateur — connectez-vous ou
créez un compte Cloudflare (gratuit), puis autorisez l'accès.

## Étape 4 — Créer la base de données D1

```bash
npx wrangler d1 create jnn-db
```

Copiez le `database_id` affiché et collez-le dans `wrangler.toml`
(remplace `REMPLACER_APRES_WRANGLER_D1_CREATE`).

## Étape 5 — Appliquer le schéma + les données de démonstration

```bash
npm run db:migrate:local     # pour tester en local d'abord
npm run db:migrate:remote    # puis pour la vraie base Cloudflare
```

## Étape 6 — Créer votre compte admin (mot de passe haché, jamais en clair)

```bash
ADMIN_USER=JNN1620 ADMIN_PASS=votre_mot_de_passe node scripts/create-admin.mjs --local
ADMIN_USER=JNN1620 ADMIN_PASS=votre_mot_de_passe node scripts/create-admin.mjs --remote
```

⚠️ Ne mettez jamais votre vrai mot de passe dans un fichier committé sur
GitHub — cette commande le hache avant de l'enregistrer, et ne le stocke
nulle part sur disque.

## Étape 6bis — Stockage des photos (Cloudflare R2) + clé de session admin

```bash
npx wrangler r2 bucket create jnn-photos   # si pas déjà fait
```

Puis, Dashboard Cloudflare → R2 → jnn-photos → Settings → Public access →
Allow Access, copiez l'URL publique (`https://pub-xxxx.r2.dev` ou un domaine
personnalisé), et collez-la dans `wrangler.toml` à la place de
`REMPLACER_APRES_ACCES_PUBLIC_R2` (champ `PHOTOS_PUBLIC_URL`).

Enfin, une clé secrète signe les sessions admin (ne jamais la committer) :

```bash
npx wrangler secret put ADMIN_SESSION_SECRET   # collez une valeur aléatoire longue
```

Pour tester en local (`npm run dev`), créez un fichier `.dev.vars` (non
committé, voir `.gitignore`) à la racine avec :

```
ADMIN_SESSION_SECRET=la_meme_valeur_aleatoire
```

## Étape 7 — Tester en local

```bash
npm run dev
```

Ouvrez `http://localhost:3000`.

## Étape 8 — Déployer sur Cloudflare Pages

Le plus simple : connecter ce dépôt GitHub directement depuis le tableau
de bord Cloudflare Pages (Workers & Pages → Créer → Pages → Connecter à
Git). Chaque `git push` déclenche alors un déploiement automatique, avec
une URL d'aperçu avant la mise en production.

## État actuel de la migration

La maquette complète a été portée sur cette base TanStack Start + D1 :
liste des véhicules avec filtres et photos, fiche détaillée avec galerie
et boutons WhatsApp/e-mail, avis clients (page dédiée + carrousel), carte
de visite partageable (WhatsApp/e-mail/.vcf), carte Google Maps, panorama
"véhicules vendus" en fond de page d'accueil, et un espace admin complet
(connexion sécurisée, ajout/édition/suppression de véhicules avec upload
de photos vers Cloudflare R2, tableau de bord des stats vues/contacts,
gestion des photos "véhicules vendus").

Contrairement au prototype, le mot de passe admin n'est jamais en clair
dans le code : il est haché (scrypt) en base, et les sessions admin sont
un jeton signé (HMAC) plutôt qu'un simple indicateur côté navigateur.

À faire avant la mise en production : suivre les étapes 6 et 6bis
ci-dessus (compte admin + bucket R2 + clé de session).
