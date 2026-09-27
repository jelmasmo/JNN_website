# JNN — consignes pour Claude

## TDD obligatoire

Tout nouveau code (fonctionnalité **ou** correction de bug) suit le skill
`tdd` (`.claude/skills/tdd/SKILL.md`) — le charger avant d'écrire du code :

- Cycle vertical, un comportement à la fois : écrire UN test → le lancer et
  le voir échouer pour la bonne raison (RED) → code minimal → le voir passer
  (GREEN). Refactor seulement une fois au vert.
- Bug : d'abord un test qui le reproduit.
- Tests à travers l'interface publique, qui décrivent le comportement
  (noms de tests en français), pas l'implémentation.
- Ne mocker qu'aux frontières du système (R2, Cloudflare, temps, hasard).
  Pour la base : `createTestDb()` (`tests/helpers/testDb.ts`) — vrai SQLite
  en mémoire avec le schéma des migrations, derrière l'interface D1.
- La logique pure enfouie dans un composant React est extraite dans
  `src/lib/` pour être testée (ex. `contactLinks.ts`, `imageOrder.ts`) ; la
  logique métier d'un handler de `src/server/functions.ts` va dans le
  module serveur concerné (ex. `saveVehicle`), le handler se contentant de
  vérifier l'admin et de déléguer.

Commandes : `npm test` (toute la suite doit rester verte), `npm run build`.
