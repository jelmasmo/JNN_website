-- Coordonnées de contact de l'entreprise (téléphone, e-mail, adresse),
-- éditables depuis l'espace admin — remplace les valeurs figées dans
-- src/lib/config.ts pour les champs qui doivent pouvoir changer sans
-- redéployer le site.

CREATE TABLE site_settings (
  id      INTEGER PRIMARY KEY CHECK (id = 1),  -- une seule ligne, toujours id=1
  phone   TEXT NOT NULL DEFAULT '+32 470 00 00 00',
  email   TEXT NOT NULL DEFAULT 'JNN1620@outlook.com',
  address TEXT NOT NULL DEFAULT 'Grote Baan 361/1, 1620 Drogenbos'
);

INSERT INTO site_settings (id, phone, email, address)
VALUES (1, '+32 470 00 00 00', 'JNN1620@outlook.com', 'Grote Baan 361/1, 1620 Drogenbos');
