import { describe, it, expect } from "vitest";
import { buildVCard, appointmentWhatsAppUrl, vehicleWhatsAppUrl, vehicleMailUrl, shareCardWhatsAppUrl, shareCardMailUrl } from "~/lib/contactLinks";

const settings = { phone: "+32 471 11 22 33", email: "contact@jnn.be", address: "Rue Neuve 1, 1000 Bruxelles" };

describe("carte de visite (.vcf)", () => {
  it("contient les coordonnées de contact actuelles", () => {
    const lines = buildVCard(settings).split("\n");
    expect(lines).toContain("TEL;TYPE=CELL:+32 471 11 22 33");
    expect(lines).toContain("EMAIL:contact@jnn.be");
    expect(lines).toContain("ADR:;;Rue Neuve 1, 1000 Bruxelles;;;;");
  });

  it("pointe vers le vrai site de JNN", () => {
    expect(buildVCard(settings).split("\n")).toContain("URL:https://jnn-drogenbos.be");
  });
});

const golf = { id: "GOLF7", title: "VW Golf 7", price: 12500 };
const PAGE = "https://jnn-drogenbos.be/vehicules/GOLF7";

function textParam(url: string, name: string) {
  return new URL(url).searchParams.get(name);
}

describe("contact WhatsApp depuis une fiche véhicule", () => {
  it("écrit au numéro de JNN avec le véhicule, son prix et le lien de la fiche", () => {
    const url = vehicleWhatsAppUrl(golf, settings.phone, PAGE, "");
    expect(url.startsWith("https://wa.me/32471112233?")).toBe(true);
    expect(textParam(url, "text")).toBe(
      "Bonjour, je suis intéressé(e) par le véhicule VW Golf 7 (12\u202f500 €) : " + PAGE
    );
  });

  it("ajoute le message du visiteur à la fin, s'il en a écrit un", () => {
    const url = vehicleWhatsAppUrl(golf, settings.phone, PAGE, "  Dispo samedi ?  ");
    expect(textParam(url, "text")).toMatch(/\n\nDispo samedi \?$/);
  });
});

describe("contact e-mail depuis une fiche véhicule", () => {
  it("écrit à l'adresse de JNN avec la référence en objet et le lien de la fiche", () => {
    const url = vehicleMailUrl(golf, settings.email, PAGE, "Reprise possible ?");
    expect(url.startsWith("mailto:contact@jnn.be?")).toBe(true);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("subject")).toBe("Intéressé par VW Golf 7 — Réf. GOLF7");
    expect(params.get("body")).toBe(
      "Bonjour,\n\nJe souhaite avoir plus d'informations sur ce véhicule :\nVW Golf 7 — 12\u202f500 €\n" +
        PAGE +
        "\n\nReprise possible ?"
    );
  });
});

describe("partage de la carte de visite", () => {
  it("envoie les coordonnées par WhatsApp au numéro du client, quel que soit son format", () => {
    const url = shareCardWhatsAppUrl("+32 (470) 12.34.56", settings);
    expect(url?.startsWith("https://wa.me/32470123456?")).toBe(true);
    expect(textParam(url!, "text")).toContain("📞 +32 471 11 22 33");
  });

  it("accepte un numéro belge local commençant par 0 (ex : 0470…)", () => {
    const url = shareCardWhatsAppUrl("0470 12 34 56", settings);
    expect(url?.startsWith("https://wa.me/32470123456?")).toBe(true);
  });

  it("accepte un numéro international écrit avec 00 (ex : 0032…)", () => {
    const url = shareCardWhatsAppUrl("0032 470 12 34 56", settings);
    expect(url?.startsWith("https://wa.me/32470123456?")).toBe(true);
  });

  it("contient le lien du site JNN, pour afficher l'aperçu de la carte", () => {
    const url = shareCardWhatsAppUrl("0470 12 34 56", settings);
    expect(textParam(url!, "text")).toContain("https://jnn-drogenbos.be");
  });

  it("met en forme le message (nom de l'entreprise en gras)", () => {
    const url = shareCardWhatsAppUrl("0470 12 34 56", settings);
    expect(textParam(url!, "text")).toContain("*JNN Drogenbos*");
  });

  it("n'envoie rien si aucun numéro n'est saisi", () => {
    expect(shareCardWhatsAppUrl("  ", settings)).toBeNull();
  });

  it("envoie les coordonnées par e-mail à l'adresse du client", () => {
    const url = shareCardMailUrl(" client@exemple.com ", settings);
    expect(url?.startsWith("mailto:client@exemple.com?")).toBe(true);
    const body = new URLSearchParams(url!.split("?")[1]).get("body");
    expect(body).toContain("E-mail : contact@jnn.be");
    expect(body).toContain("https://jnn-drogenbos.be");
  });

  it("n'envoie pas d'e-mail si aucune adresse n'est saisie", () => {
    expect(shareCardMailUrl("", settings)).toBeNull();
  });
});

describe("prise de rendez-vous depuis l'accueil", () => {
  it("ouvre WhatsApp vers JNN avec une demande de rendez-vous", () => {
    const url = appointmentWhatsAppUrl(settings.phone);
    expect(url.startsWith("https://wa.me/32471112233?")).toBe(true);
    expect(textParam(url, "text")).toBe(
      "Bonjour, je souhaiterais prendre rendez-vous pour venir voir vos véhicules chez JNN."
    );
  });
});

describe("numéro WhatsApp de JNN saisi au format local", () => {
  it("fonctionne aussi si le numéro de JNN est enregistré comme 0471 …", () => {
    const url = appointmentWhatsAppUrl("0471 11 22 33");
    expect(url.startsWith("https://wa.me/32471112233?")).toBe(true);
  });
});
