import { describe, it, expect } from "vitest";
import { generalWhatsAppUrl, buildVCard, cardShareText, appointmentWhatsAppUrl, vehicleWhatsAppUrl, vehicleMailUrl, shareCardWhatsAppUrl, shareCardMailUrl } from "~/lib/contactLinks";

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
    expect(body).toContain("https://jnn-drogenbos.be/carte-jnn.jpg");
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

describe("partage de la carte en image (menu de partage du téléphone)", () => {
  it("accompagne l'image des coordonnées et du lien du site", () => {
    const text = cardShareText(settings);
    expect(text).toContain("+32 471 11 22 33");
    expect(text).toContain("contact@jnn.be");
    expect(text).toContain("https://jnn-drogenbos.be");
  });
});

describe("messages dans la langue du visiteur", () => {
  it("un visiteur néerlandophone écrit à JNN en néerlandais au sujet d'un véhicule", () => {
    const url = vehicleWhatsAppUrl(golf, settings.phone, PAGE, "", "nl");
    expect(textParam(url, "text")).toBe("Goeiedag, ik ben geïnteresseerd in de VW Golf 7 (€ 12.500): " + PAGE);
  });

  it("un visiteur anglophone envoie un e-mail en anglais au sujet d'un véhicule", () => {
    const params = new URLSearchParams(vehicleMailUrl(golf, settings.email, PAGE, "", "en").split("?")[1]);
    expect(params.get("subject")).toBe("Interested in VW Golf 7 — Ref. GOLF7");
    expect(params.get("body")).toBe(
      "Hello,\n\nI would like more information about this vehicle:\nVW Golf 7 — €12,500\n" + PAGE
    );
  });

  it("la demande de rendez-vous est rédigée en néerlandais pour un visiteur néerlandophone", () => {
    expect(textParam(appointmentWhatsAppUrl(settings.phone, "nl"), "text")).toBe(
      "Goeiedag, ik zou graag een afspraak maken om uw wagens bij JNN te komen bekijken."
    );
  });

  it("le bouton WhatsApp de l'en-tête ouvre une conversation dans la langue du visiteur", () => {
    const url = generalWhatsAppUrl(settings.phone, "en");
    expect(url.startsWith("https://wa.me/32471112233?")).toBe(true);
    expect(textParam(url, "text")).toBe("Hello, I'm contacting you about the vehicles available at JNN.");
  });

  it("la carte de visite partagée en image est présentée en anglais sur la version anglaise", () => {
    const text = cardShareText(settings, "en");
    expect(text.split("\n")[0]).toBe("Hello, here is my business card:");
    expect(text).toContain("Edan — Used car sales");
    expect(text).toContain("🚗 Our stock: https://jnn-drogenbos.be");
  });

  it("la carte envoyée par WhatsApp est rédigée en néerlandais sur la version néerlandaise", () => {
    const text = textParam(shareCardWhatsAppUrl("0470 12 34 56", settings, "nl")!, "text")!;
    expect(text.split("\n")[0]).toBe("Goeiedag 👋 Hier zijn mijn contactgegevens:");
    expect(text).toContain("*JNN Drogenbos* — Tweedehandswagens");
    expect(text).toContain("🚗 Ontdek ons aanbod:");
  });

  it("la carte envoyée par e-mail est rédigée en anglais sur la version anglaise", () => {
    const params = new URLSearchParams(shareCardMailUrl("client@example.com", settings, "en")!.split("?")[1]);
    expect(params.get("subject")).toBe("JNN contact details — used vehicles");
    expect(params.get("body")).toContain("Phone: +32 471 11 22 33");
    expect(params.get("body")).toContain("My business card: https://jnn-drogenbos.be/carte-jnn.jpg");
  });

  it("le fichier .vcf indique le métier dans la langue de la page", () => {
    expect(buildVCard(settings, "nl").split("\n")).toContain("TITLE:Verkoop van tweedehandswagens");
  });
});

