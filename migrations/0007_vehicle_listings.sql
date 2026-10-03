-- Suivi de diffusion : sur quelles plateformes (AutoScout24, 2ememain,
-- Facebook Marketplace, Gocar) l'annonce d'un véhicule est publiée, et avec
-- quelles informations (fingerprint), pour signaler dans l'admin les
-- annonces à mettre à jour ou à retirer. Pas de clé étrangère vers
-- vehicles : la ligne doit survivre à la suppression du véhicule, pour
-- rappeler de retirer l'annonce.

CREATE TABLE vehicle_listings (
  vehicle_id     TEXT NOT NULL,
  platform       TEXT NOT NULL,
  vehicle_title  TEXT NOT NULL,
  listing_url    TEXT,
  fingerprint    TEXT NOT NULL,
  published_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (vehicle_id, platform)
);
