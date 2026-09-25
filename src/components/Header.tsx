import { Link } from "@tanstack/react-router";
import { OWNER } from "~/lib/config";
import { useHasAdminToken } from "~/lib/adminSession";

export function Header() {
  const isAdmin = useHasAdminToken();
  const waHref = `https://wa.me/${OWNER.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    "Bonjour, je vous contacte au sujet de vos véhicules disponibles chez JNN."
  )}`;
  return (
    <header className={isAdmin ? "header-admin" : undefined}>
      <div className="header-inner">
        <Link to="/" className="logo">
          JNN <span className="logo-city">Drogenbos</span>
        </Link>
        <nav>
          <a href="/#stock">Stock</a>
          <Link to="/avis">Avis clients</Link>
          <a href="/#carte">Carte de visite</a>
          <a href="/#contact">Contact</a>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isAdmin && <span className="admin-pill">Admin</span>}
          <a href={`tel:${OWNER.phone.replace(/[^0-9+]/g, "")}`} className="call-btn">
            ☎ Appeler
          </a>
          <a href={waHref} target="_blank" rel="noreferrer" className="icon-btn" title="WhatsApp" aria-label="Contacter par WhatsApp">
            <svg viewBox="0 0 32 32" fill="#fff" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 1.9 6.5L4 29l7.7-1.9c1.8 1 3.9 1.5 6 1.5 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.9 0-3.7-.5-5.3-1.4l-.4-.2-4.3 1.1 1.1-4.2-.2-.4A9.6 9.6 0 0 1 6.2 15c0-5.4 4.4-9.8 9.8-9.8s9.8 4.4 9.8 9.8-4.4 9.8-9.8 9.8z" />
              <path d="M21.6 17.9c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.1-.6-.1-.3-.7-1.7-1-2.3-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.2.3-.9 1-.9 2.3s.9 2.7 1 2.9c.1.2 1.8 2.8 4.4 3.9 2.6 1.1 2.6.7 3.1.7.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.5-.3z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
