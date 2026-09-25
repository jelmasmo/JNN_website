-- Schéma initial de la base JNN.
-- Remplace le localStorage du prototype : ces données sont désormais
-- partagées par tous les visiteurs et tous les appareils.

CREATE TABLE vehicles (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  sub           TEXT,
  type          TEXT NOT NULL,
  first_reg     TEXT,              -- format "MM/AAAA"
  km            INTEGER NOT NULL DEFAULT 0,
  fuel          TEXT,
  gearbox       TEXT,
  kw            INTEGER,           -- puissance en kW (les ch sont calculés à l'affichage)
  color         TEXT,
  price         INTEGER NOT NULL,
  description   TEXT,
  options_json  TEXT NOT NULL DEFAULT '[]',   -- tableau JSON d'options
  images_json   TEXT NOT NULL DEFAULT '[]',   -- tableau JSON d'URLs de photos
  position      INTEGER NOT NULL DEFAULT 0,   -- ordre d'affichage dans le stock
  sold_at       TEXT,              -- rempli quand le véhicule est marqué vendu
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  author        TEXT NOT NULL,
  review_date   TEXT,
  stars         INTEGER NOT NULL,
  body          TEXT NOT NULL,
  is_featured   INTEGER NOT NULL DEFAULT 0,   -- 1 = affiché dans le carrousel d'accueil
  position      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE vehicle_stats (
  vehicle_id    TEXT PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
  views         INTEGER NOT NULL DEFAULT 0,
  contacts      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE sold_photos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  url           TEXT NOT NULL,     -- URL de l'image (stockée sur Cloudflare Images ou R2, voir README)
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE admin_users (
  username      TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL      -- haché (scrypt/PBKDF2), jamais en clair
);

CREATE INDEX idx_vehicles_position ON vehicles(position);
CREATE INDEX idx_reviews_position ON reviews(position);
