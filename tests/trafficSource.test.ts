import { describe, it, expect } from "vitest";
import { classifySource, sourceLabel } from "~/lib/trafficSource";

const site = "jnn-drogenbos.be";
const from = (referrer: string, src?: string) => classifySource({ referrer, src, siteHost: site });

describe("provenance d'un visiteur", () => {
  it("reconnaît une arrivée depuis une recherche Google, quel que soit le pays", () => {
    expect(from("https://www.google.be/")).toBe("google");
    expect(from("https://www.google.com/search?q=jnn")).toBe("google");
  });

  it("reconnaît les sites d'annonces", () => {
    expect(from("https://www.autoscout24.be/fr/offres/mini-cooper")).toBe("autoscout24");
    expect(from("https://www.2ememain.be/v/autos/")).toBe("2ememain");
    expect(from("https://www.2dehands.be/v/auto-s/")).toBe("2ememain");
    expect(from("https://gocar.be/fr/")).toBe("gocar");
    expect(from("https://www.leboncoin.fr/voitures/")).toBe("leboncoin");
  });

  it("reconnaît les réseaux sociaux, y compris leurs liens de redirection", () => {
    expect(from("https://l.facebook.com/")).toBe("facebook");
    expect(from("https://m.facebook.com/marketplace")).toBe("facebook");
    expect(from("https://l.instagram.com/")).toBe("instagram");
    expect(from("https://www.tiktok.com/")).toBe("tiktok");
  });

  it("classe en accès direct une arrivée sans site d'origine (adresse tapée, favori, lien WhatsApp)", () => {
    expect(from("")).toBe("direct");
  });

  it("ne compte pas la navigation à l'intérieur du site comme une provenance", () => {
    expect(from("https://jnn-drogenbos.be/avis")).toBe("interne");
    expect(from("https://www.jnn-drogenbos.be/")).toBe("interne");
  });

  it("garde le nom du site d'origine quand il n'est pas connu", () => {
    expect(from("https://www.exemple-forum.be/sujet/12")).toBe("exemple-forum.be");
  });

  it("donne la priorité à l'étiquette mise dans le lien (?src=…), même sans site d'origine", () => {
    expect(from("", "whatsapp")).toBe("whatsapp");
    expect(from("https://www.google.be/", "autoscout24")).toBe("autoscout24");
    expect(from("", "QR")).toBe("qr");
  });

  it("ignore une étiquette fantaisiste ou trop longue", () => {
    expect(from("", "<script>alert(1)</script>")).toBe("direct");
    expect(from("", "x".repeat(80))).toBe("direct");
  });
});

describe("nom affiché d'une provenance dans le tableau de bord", () => {
  it("traduit les provenances connues en clair", () => {
    expect(sourceLabel("google")).toBe("Google");
    expect(sourceLabel("2ememain")).toBe("2ememain / 2dehands");
    expect(sourceLabel("direct")).toBe("Accès direct (adresse tapée, favori, lien sans étiquette)");
  });

  it("affiche tel quel un site d'origine inconnu", () => {
    expect(sourceLabel("exemple-forum.be")).toBe("exemple-forum.be");
  });
});
