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
ADMIN_USER=JNN1620 ADMIN_PASS=votre_mot_de_passe node scripts/create-admin.mjs --remote
```

⚠️ Ne mettez jamais votre vrai mot de passe dans un fichier committé sur
GitHub — cette commande le hache avant de l'enregistrer, et ne le stocke
nulle part sur disque.

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

Cette première version reprend : la liste des véhicules en stock, la
fiche détaillée d'un véhicule, et les avis clients — lus depuis la vraie
base de données D1 au lieu du `localStorage` du prototype précédent.

Pas encore migré (viendra dans les prochaines étapes) : l'espace admin
(ajout/édition/suppression de véhicules, gestion des photos), les
statistiques de vues/contacts, les boutons WhatsApp/email, la carte de
visite, le panorama "véhicules vendus", et l'affichage des photos
(actuellement `images_json` est prêt à recevoir des URLs, mais il faudra
un endroit où les héberger — Cloudflare Images ou R2, à voir ensemble).
