// Coordonnées affichées sur la carte de visite et utilisées pour les liens
// WhatsApp / e-mail par défaut. À adapter aux vraies coordonnées de JNN.
export const OWNER = {
  name: "Edan",
  role: "Vente de véhicules d'occasion",
  phone: "+32 470 00 00 00",
  email: "JNN1620@outlook.com",
  address: "Grote Baan 361/1, 1620 Drogenbos",
  website: "www.jnn.be",
};

export const FILTERS = [
  { key: "tous", label: "Tous les véhicules" },
  { key: "citadine", label: "Citadines" },
  { key: "berline", label: "Berlines" },
  { key: "suv", label: "SUV" },
] as const;

export function fmtPrice(p: number): string {
  return Number(p).toLocaleString("fr-BE") + " €";
}
export function fmtKm(k: number): string {
  return Number(k).toLocaleString("fr-BE") + " km";
}
