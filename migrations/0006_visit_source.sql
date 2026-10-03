-- Rapport de provenance : pour chaque événement, d'où venait le visiteur
-- (google, autoscout24, facebook, whatsapp, direct… — voir
-- src/lib/trafficSource.ts) et s'il s'agit de son arrivée sur le site
-- (is_entry = 1), ce qui permet de compter une visite par visiteur.

ALTER TABLE visit_events ADD COLUMN source TEXT;
ALTER TABLE visit_events ADD COLUMN is_entry INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_visit_events_source ON visit_events(source);
