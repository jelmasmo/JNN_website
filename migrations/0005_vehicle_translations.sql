-- Traductions automatiques (néerlandais, anglais) des textes saisis en
-- français dans l'admin pour chaque annonce : sous-titre, couleur,
-- description et équipements. Objet JSON { "nl": {...}, "en": {...} },
-- rempli à l'enregistrement de l'annonce (voir src/server/translation.ts).
ALTER TABLE vehicles ADD COLUMN translations_json TEXT NOT NULL DEFAULT '{}';
