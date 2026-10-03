import type { Lang } from "~/lib/i18n";

/** Langues dans lesquelles les annonces (saisies en français) sont traduites. */
export const TRANSLATED_LANGS = ["nl", "en"] as const satisfies readonly Lang[];
export type TranslatedLang = (typeof TRANSLATED_LANGS)[number];

/** Textes libres d'une annonce, saisis en français dans l'admin. */
export interface ListingText {
  sub: string;
  color: string;
  description: string;
  options: string[];
}

export type ListingTranslations = Partial<Record<TranslatedLang, ListingText>>;

/**
 * Traduit les textes d'une annonce du français vers `lang`. En production :
 * Workers AI (voir workersAiTranslator) ; dans les tests : un faux
 * traducteur, puisque c'est un service externe.
 */
export type Translator = (text: ListingText, lang: TranslatedLang) => Promise<ListingText>;
