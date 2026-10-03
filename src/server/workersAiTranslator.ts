import type { ListingText, TranslatedLang, Translator } from "./translation";

// Traduction automatique des annonces avec Workers AI (l'IA de Cloudflare,
// binding "AI" dans wrangler.toml). Un modèle de langage généraliste plutôt
// qu'un modèle de traduction brut : on peut lui demander du néerlandais de
// Belgique, le vocabulaire automobile et de ne pas toucher aux noms de
// marques et de finitions.
const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const TARGET: Record<TranslatedLang, string> = {
  nl: "Belgian Dutch (Flemish, as used in Belgium: say 'wagen', address the reader with the formal 'u')",
  en: "British English",
};

const SCHEMA = {
  type: "object",
  properties: {
    sub: { type: "string" },
    color: { type: "string" },
    description: { type: "string" },
    options: { type: "array", items: { type: "string" } },
  },
  required: ["sub", "color", "description", "options"],
};

function instructions(lang: TranslatedLang): string {
  return [
    `You translate used-car listings of JNN, a used-car dealer in Drogenbos (Belgium), from French into ${TARGET[lang]}.`,
    "You receive a JSON object and answer with the same JSON object, every value translated.",
    "Keep brand names, model names, trim levels, product names and abbreviations unchanged (e.g. Sportback, i-Cockpit, MBUX, CarPlay, GPS, LED).",
    "Colour names that are a manufacturer's paint name keep their proper noun (e.g. 'Bleu Ascari' → 'Ascari blue' / 'Ascariblauw').",
    "Translate every item of \"options\" and keep exactly the same number of items, in the same order.",
    "Answer with the JSON object only, nothing else.",
  ].join("\n");
}

export function workersAiTranslator(ai: Ai): Translator {
  return async (text, lang) => {
    const result = (await ai.run(MODEL, {
      messages: [
        { role: "system", content: instructions(lang) },
        { role: "user", content: JSON.stringify(text) },
      ],
      response_format: { type: "json_schema", json_schema: SCHEMA },
      max_tokens: 2048,
      temperature: 0.2,
    })) as { response?: unknown };
    return parseTranslation(result.response, text);
  };
}

/** Vérifie la réponse de l'IA ; lève une erreur si elle ne correspond pas à l'annonce d'origine. */
function parseTranslation(response: unknown, source: ListingText): ListingText {
  const data = (typeof response === "string" ? JSON.parse(response) : response) as Partial<ListingText> | null;
  const isText = (v: unknown) => typeof v === "string";
  if (
    !data ||
    !isText(data.sub) ||
    !isText(data.color) ||
    !isText(data.description) ||
    !Array.isArray(data.options) ||
    !data.options.every(isText)
  ) {
    throw new Error("Traduction automatique incomplète.");
  }
  if (data.options.length !== source.options.length) {
    throw new Error("Traduction automatique incohérente : nombre d'équipements différent.");
  }
  return { sub: data.sub!, color: data.color!, description: data.description!, options: data.options };
}
