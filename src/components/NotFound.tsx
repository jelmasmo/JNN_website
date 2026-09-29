import { Link } from "@tanstack/react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";

/**
 * Page « introuvable » aux couleurs de JNN. `vehicle` : variante affichée
 * quand une fiche véhicule n'existe plus (souvent parce qu'il a été vendu).
 */
export function NotFound({ vehicle = false }: { vehicle?: boolean }) {
  return (
    <>
      <Header />
      <main className="notfound">
        <div className="wrap notfound-inner">
          <span className="notfound-code" aria-hidden="true">
            404
          </span>
          <span className="eyebrow">{vehicle ? "Annonce indisponible" : "Page introuvable"}</span>
          <h1>
            {vehicle ? (
              <>
                Ce véhicule a <em>déjà trouvé preneur</em>.
              </>
            ) : (
              <>
                Mauvais <em>virage</em>.
              </>
            )}
          </h1>
          <p>
            {vehicle
              ? "Cette annonce n'est plus en ligne : le véhicule a probablement été vendu. D'autres occasions choisies vous attendent dans notre stock."
              : "La page que vous cherchez n'existe pas ou a été déplacée. Nos véhicules, eux, sont toujours là."}
          </p>
          <div className="hero-ctas">
            <a href="/#stock" className="btn-primary">
              Voir le stock
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <Link to="/" className="btn-ghost">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
