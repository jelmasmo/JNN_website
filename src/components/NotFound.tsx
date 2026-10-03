import { Link } from "@tanstack/react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useLang, useT } from "~/lib/lang";
import { localizePath } from "~/lib/langPath";

/**
 * Page « introuvable » aux couleurs de JNN. `vehicle` : variante affichée
 * quand une fiche véhicule n'existe plus (souvent parce qu'il a été vendu).
 */
export function NotFound({ vehicle = false }: { vehicle?: boolean }) {
  const tr = useT();
  const lang = useLang();
  const k = vehicle ? "vehicle" : "page";
  return (
    <>
      <Header />
      <main className="notfound">
        <div className="wrap notfound-inner">
          <span className="notfound-code" aria-hidden="true">
            404
          </span>
          <span className="eyebrow">{tr(`nf.${k}Eyebrow`)}</span>
          <h1>
            {tr(`nf.${k}TitleBefore`)}
            <em>{tr(`nf.${k}TitleEm`)}</em>
            {tr(`nf.${k}TitleAfter`)}
          </h1>
          <p>{tr(`nf.${k}Text`)}</p>
          <div className="hero-ctas">
            <a href={`${localizePath("/", lang)}#stock`} className="btn-primary">
              {tr("home.seeStock")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <Link to="/" className="btn-ghost">
              {tr("nf.home")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
