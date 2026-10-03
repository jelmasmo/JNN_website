import { describe, it, expect } from "vitest";
import { splitLangPath, localizePath, languageRedirect, alternateLinks } from "~/lib/langPath";

describe("langue lue dans l'adresse", () => {
  it("reconnaît une page en néerlandais à son préfixe /nl", () => {
    expect(splitLangPath("/nl/vehicules/A1-21")).toEqual({ lang: "nl", path: "/vehicules/A1-21" });
  });

  it("reconnaît l'accueil en anglais", () => {
    expect(splitLangPath("/en")).toEqual({ lang: "en", path: "/" });
    expect(splitLangPath("/en/")).toEqual({ lang: "en", path: "/" });
  });

  it("considère une adresse sans préfixe comme française", () => {
    expect(splitLangPath("/avis")).toEqual({ lang: "fr", path: "/avis" });
    expect(splitLangPath("/")).toEqual({ lang: "fr", path: "/" });
  });

  it("ne confond pas une page qui commence par les mêmes lettres avec un préfixe de langue", () => {
    expect(splitLangPath("/enchères")).toEqual({ lang: "fr", path: "/enchères" });
  });
});

describe("adresse d'une page dans une langue", () => {
  it("garde les adresses françaises telles quelles", () => {
    expect(localizePath("/vehicules/A1-21", "fr")).toBe("/vehicules/A1-21");
  });

  it("préfixe les pages néerlandaises et anglaises", () => {
    expect(localizePath("/avis", "nl")).toBe("/nl/avis");
    expect(localizePath("/vehicules/A1-21", "en")).toBe("/en/vehicules/A1-21");
  });

  it("donne /nl pour l'accueil néerlandais", () => {
    expect(localizePath("/", "nl")).toBe("/nl");
  });

  it("laisse l'espace professionnel et les fichiers techniques sans préfixe", () => {
    expect(localizePath("/admin/dashboard", "nl")).toBe("/admin/dashboard");
    expect(localizePath("/sitemap.xml", "en")).toBe("/sitemap.xml");
    expect(localizePath("/carte-jnn.jpg", "nl")).toBe("/carte-jnn.jpg");
  });

  it("préfixe une fiche dont le nom contient un point (ex. « Golf 1.6 »)", () => {
    expect(localizePath("/vehicules/Golf%201.6", "nl")).toBe("/nl/vehicules/Golf%201.6");
  });

  it("ne préfixe pas deux fois une adresse déjà dans la bonne langue", () => {
    expect(localizePath("/nl/avis", "nl")).toBe("/nl/avis");
  });
});

describe("redirection d'un visiteur vers sa langue", () => {
  it("envoie un navigateur néerlandophone arrivé sur une page française vers la version néerlandaise", () => {
    expect(languageRedirect({ pathname: "/vehicules/A1-21", acceptLanguage: "nl-BE,nl;q=0.9" })).toBe("/nl/vehicules/A1-21");
  });

  it("ne redirige pas un navigateur francophone", () => {
    expect(languageRedirect({ pathname: "/avis", acceptLanguage: "fr-BE,fr;q=0.9" })).toBeNull();
  });

  it("ne redirige pas les robots sans langue (Google, aperçus WhatsApp)", () => {
    expect(languageRedirect({ pathname: "/", acceptLanguage: null })).toBeNull();
  });

  it("respecte le choix fait avec le sélecteur de langue", () => {
    expect(languageRedirect({ pathname: "/", acceptLanguage: "nl-BE", cookie: "jnn-lang=fr" })).toBeNull();
    expect(languageRedirect({ pathname: "/avis", acceptLanguage: "fr-BE", cookie: "jnn-lang=en" })).toBe("/en/avis");
  });

  it("ne touche jamais une adresse qui porte déjà sa langue", () => {
    expect(languageRedirect({ pathname: "/en/avis", acceptLanguage: "nl-BE" })).toBeNull();
  });

  it("ne redirige pas l'espace professionnel", () => {
    expect(languageRedirect({ pathname: "/admin/login", acceptLanguage: "nl-BE" })).toBeNull();
  });
});

describe("versions linguistiques annoncées à Google (hreflang)", () => {
  it("donne l'adresse complète de la page dans chaque langue, le français servant par défaut", () => {
    expect(alternateLinks("/avis")).toEqual([
      { hrefLang: "fr-BE", href: "https://jnn-drogenbos.be/avis" },
      { hrefLang: "nl-BE", href: "https://jnn-drogenbos.be/nl/avis" },
      { hrefLang: "en", href: "https://jnn-drogenbos.be/en/avis" },
      { hrefLang: "x-default", href: "https://jnn-drogenbos.be/avis" },
    ]);
  });
});
