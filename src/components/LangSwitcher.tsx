import { useLocation } from "@tanstack/react-router";
import { LANGS, langCookie, type Lang } from "~/lib/i18n";
import { useLang, useT } from "~/lib/lang";
import { localizePath } from "~/lib/langPath";

const NAMES: Record<Lang, string> = { fr: "Français", nl: "Nederlands", en: "English" };

/**
 * Sélecteur FR · NL · EN de l'en-tête. Le choix est mémorisé un an dans un
 * cookie (il prime ensuite sur la langue du navigateur) et l'on passe à la
 * même page dans l'autre langue (/avis → /nl/avis).
 */
export function LangSwitcher() {
  const current = useLang();
  const tr = useT();
  const location = useLocation();

  function choose(lang: Lang) {
    if (lang === current) return;
    document.cookie = langCookie(lang);
    window.location.assign(localizePath(location.pathname, lang) + (location.searchStr ?? "") + window.location.hash);
  }

  return (
    <div className="lang-switch" role="group" aria-label={tr("lang.aria")}>
      {LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          title={NAMES[lang]}
          aria-label={NAMES[lang]}
          aria-pressed={lang === current}
          className={lang === current ? "active" : undefined}
          onClick={() => choose(lang)}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
