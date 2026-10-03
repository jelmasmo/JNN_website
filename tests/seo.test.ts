import { describe, it, expect } from "vitest";
import { sitemapXml, robotsTxt, vehicleHead, vehicleJsonLd, dealerJsonLd } from "~/lib/seo";
import { fmtPrice } from "~/lib/config";
import type { VehicleView } from "~/server/vehicles";

function car(overrides: Partial<VehicleView> = {}): VehicleView {
  return {
    id: "A1-21",
    title: "Audi A1",
    sub: "Citadine — Sportback",
    type: "citadine",
    first_reg: "03/2021",
    km: 41000,
    fuel: "Essence",
    gearbox: "Manuelle",
    kw: 85,
    color: "Bleu",
    price: 15900,
    description: "Très propre.",
    options: ["GPS"],
    images: ["https://photos.example/a.jpg", "https://photos.example/b.jpg"],
    translations: {},
    position: 0,
    sold_at: null,
    ...overrides,
  };
}

const settings = {
  phone: "+32 470 12 34 56",
  email: "JNN1620@outlook.com",
  address: "Grote Baan 361/1, 1620 Drogenbos",
};

describe("sitemap", () => {
  it("liste l'accueil, la page des avis et chaque véhicule en stock avec leur adresse complète", () => {
    const xml = sitemapXml(["A1-21", "GOLF-19"]);
    expect(xml).toContain("<loc>https://jnn-drogenbos.be/</loc>");
    expect(xml).toContain("<loc>https://jnn-drogenbos.be/avis</loc>");
    expect(xml).toContain("<loc>https://jnn-drogenbos.be/vehicules/A1-21</loc>");
    expect(xml).toContain("<loc>https://jnn-drogenbos.be/vehicules/GOLF-19</loc>");
  });

  it("est un XML de sitemap valide, même si un identifiant contient des caractères spéciaux", () => {
    const xml = sitemapXml(["C&A 1"]);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain("<loc>https://jnn-drogenbos.be/vehicules/C%26A%201</loc>");
  });
});

describe("sitemap en trois langues", () => {
  it("liste aussi chaque page en néerlandais et en anglais", () => {
    const xml = sitemapXml(["A1-21"]);
    expect(xml).toContain("<loc>https://jnn-drogenbos.be/nl</loc>");
    expect(xml).toContain("<loc>https://jnn-drogenbos.be/en/avis</loc>");
    expect(xml).toContain("<loc>https://jnn-drogenbos.be/nl/vehicules/A1-21</loc>");
  });

  it("relie les versions d'une même page entre elles pour Google", () => {
    const xml = sitemapXml([]);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="nl-BE" href="https://jnn-drogenbos.be/nl/avis"/>');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="x-default" href="https://jnn-drogenbos.be/avis"/>');
  });
});

describe("robots.txt", () => {
  it("laisse les moteurs de recherche explorer le site mais pas l'espace professionnel", () => {
    const txt = robotsTxt();
    expect(txt).toContain("User-agent: *");
    expect(txt).toContain("Disallow: /admin");
  });

  it("indique l'adresse du sitemap", () => {
    expect(robotsTxt()).toContain("Sitemap: https://jnn-drogenbos.be/sitemap.xml");
  });
});

describe("aperçu d'une fiche véhicule (WhatsApp, Facebook, Google)", () => {
  it("met le modèle, l'année et le prix dans le titre", () => {
    expect(vehicleHead(car(), "fr").title).toBe(`Audi A1 2021 – ${fmtPrice(15900, "fr")} | JNN Drogenbos`);
  });

  it("écrit le titre selon les habitudes de la langue du visiteur", () => {
    expect(vehicleHead(car(), "nl").title).toBe("Audi A1 2021 – € 15.900 | JNN Drogenbos");
  });

  it("résume kilométrage, carburant, boîte et puissance dans la description, traduits", () => {
    const d = vehicleHead(car(), "nl").description;
    expect(d).toContain("41.000 km");
    expect(d).toContain("Benzine");
    expect(d).toContain("85 kW (116 pk)");
  });

  it("utilise la première photo du véhicule comme image d'aperçu", () => {
    expect(vehicleHead(car(), "fr").image).toBe("https://photos.example/a.jpg");
  });

  it("se rabat sur la carte de visite JNN quand le véhicule n'a pas encore de photo", () => {
    expect(vehicleHead(car({ images: [] }), "fr").image).toBe("https://jnn-drogenbos.be/carte-jnn.jpg");
  });

  it("ignore les emplacements de photo vides (« placeholder ») des annonces sans vraie photo", () => {
    const sansPhoto = car({ images: ["placeholder", "placeholder"] });
    expect(vehicleHead(sansPhoto, "fr").image).toBe("https://jnn-drogenbos.be/carte-jnn.jpg");
    expect((vehicleJsonLd(sansPhoto, "fr", settings) as any).image).toBeUndefined();
  });

  it("donne l'adresse définitive de la fiche", () => {
    expect(vehicleHead(car(), "fr").url).toBe("https://jnn-drogenbos.be/vehicules/A1-21");
  });

  it("donne l'adresse de la fiche dans la langue du visiteur", () => {
    expect(vehicleHead(car(), "nl").url).toBe("https://jnn-drogenbos.be/nl/vehicules/A1-21");
    expect((vehicleJsonLd(car(), "en", settings) as any).url).toBe("https://jnn-drogenbos.be/en/vehicules/A1-21");
  });
});

describe("données structurées d'un véhicule (schema.org)", () => {
  it("décrit une voiture d'occasion avec son prix en euros", () => {
    const ld = vehicleJsonLd(car(), "fr", settings) as any;
    expect(ld["@type"]).toBe("Car");
    expect(ld.name).toBe("Audi A1");
    expect(ld.itemCondition).toBe("https://schema.org/UsedCondition");
    expect(ld.offers).toMatchObject({ "@type": "Offer", price: 15900, priceCurrency: "EUR" });
  });

  it("donne le kilométrage, la date de première immatriculation et les photos", () => {
    const ld = vehicleJsonLd(car(), "fr", settings) as any;
    expect(ld.mileageFromOdometer).toEqual({ "@type": "QuantitativeValue", value: 41000, unitCode: "KMT" });
    expect(ld.dateVehicleFirstRegistered).toBe("2021-03");
    expect(ld.image).toEqual(["https://photos.example/a.jpg", "https://photos.example/b.jpg"]);
  });

  it("annonce le véhicule en stock, ou vendu une fois marqué comme tel", () => {
    expect((vehicleJsonLd(car(), "fr", settings) as any).offers.availability).toBe("https://schema.org/InStock");
    const sold = vehicleJsonLd(car({ sold_at: "2026-09-01" }), "fr", settings) as any;
    expect(sold.offers.availability).toBe("https://schema.org/SoldOut");
  });

  it("indique JNN comme vendeur", () => {
    const ld = vehicleJsonLd(car(), "fr", settings) as any;
    expect(ld.offers.seller).toMatchObject({ "@type": "AutoDealer", name: "JNN Drogenbos" });
  });
});

describe("données structurées du garage (schema.org)", () => {
  it("présente JNN comme un vendeur automobile avec ses coordonnées", () => {
    const ld = dealerJsonLd(settings) as any;
    expect(ld["@type"]).toBe("AutoDealer");
    expect(ld.name).toBe("JNN Drogenbos");
    expect(ld.url).toBe("https://jnn-drogenbos.be");
    expect(ld.telephone).toBe("+32 470 12 34 56");
    expect(ld.email).toBe("JNN1620@outlook.com");
  });

  it("découpe l'adresse en rue, code postal et commune pour Google", () => {
    const ld = dealerJsonLd(settings) as any;
    expect(ld.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "Grote Baan 361/1",
      postalCode: "1620",
      addressLocality: "Drogenbos",
      addressCountry: "BE",
    });
  });
});
