-- Suivi événementiel pour le reporting admin : chaque vue de fiche
-- véhicule, vue de la page d'accueil, ou contact (WhatsApp/e-mail) est
-- horodatée avec une estimation géographique du visiteur (fournie
-- gratuitement par Cloudflare via request.cf — pas un service tiers).
-- Complète vehicle_stats (compteurs cumulés) avec de l'historique dans
-- le temps et une répartition géographique, nécessaires pour des KPIs
-- de décision (tendance, taux de conversion par période, provenance).

CREATE TABLE visit_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type  TEXT NOT NULL,   -- 'home_view' | 'vehicle_view' | 'contact_whatsapp' | 'contact_email'
  vehicle_id  TEXT,            -- NULL si non lié à un véhicule (ex: vue de l'accueil)
  path        TEXT,
  country     TEXT,            -- code pays ISO (estimation Cloudflare, ex: "BE")
  city        TEXT,
  region      TEXT,
  referrer    TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_visit_events_created ON visit_events(created_at);
CREATE INDEX idx_visit_events_vehicle ON visit_events(vehicle_id);
CREATE INDEX idx_visit_events_type ON visit_events(event_type);
