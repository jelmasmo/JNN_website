import { describe, it, expect } from "vitest";
import { workersAiTranslator } from "~/server/workersAiTranslator";

const source = {
  sub: "Berline compacte",
  color: "Noir Saphir",
  description: "Entretenue en concession.",
  options: ["Sièges chauffants", "GPS intégré"],
};

/** Fausse IA Cloudflare (service externe) qui renvoie toujours `response`. */
function fakeAi(response: unknown) {
  return { run: async () => ({ response }) } as unknown as Ai;
}

describe("traduction par l'IA de Cloudflare", () => {
  it("renvoie les textes traduits par l'IA", async () => {
    const translated = {
      sub: "Compacte sedan",
      color: "Saffierzwart",
      description: "Onderhouden bij de dealer.",
      options: ["Verwarmde zetels", "Ingebouwde gps"],
    };
    const translate = workersAiTranslator(fakeAi(JSON.stringify(translated)));
    expect(await translate(source, "nl")).toEqual(translated);
  });

  it("refuse une réponse où il manque des équipements", async () => {
    const translate = workersAiTranslator(
      fakeAi({ sub: "Sedan", color: "Zwart", description: "Onderhouden.", options: ["Verwarmde zetels"] })
    );
    await expect(translate(source, "nl")).rejects.toThrow("équipements");
  });

  it("refuse une réponse à laquelle il manque un texte", async () => {
    const translate = workersAiTranslator(fakeAi({ sub: "Sedan", options: ["A", "B"] }));
    await expect(translate(source, "nl")).rejects.toThrow("incomplète");
  });
});

