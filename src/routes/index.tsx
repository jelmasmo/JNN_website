import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  getVehiclesList,
  getFeaturedReviews,
  adminListSoldPhotos,
} from "~/server/functions";
import { FILTERS } from "~/lib/config";
import { VehicleCard } from "~/components/VehicleCard";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { BizCardSection } from "~/components/BizCardSection";
import { HeroReviewCard } from "~/components/HeroReviewCard";
import { appointmentWhatsAppUrl } from "~/lib/contactLinks";
import { useHasAdminToken } from "~/lib/adminSession";
import { useSiteSettings } from "~/lib/siteSettings";
import type { VehicleView } from "~/server/vehicles";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [vehicles, reviews, soldPhotos] = await Promise.all([
      getVehiclesList(),
      getFeaturedReviews(),
      adminListSoldPhotos(),
    ]);
    return { vehicles, reviews, soldPhotos };
  },
  component: HomePage,
});

function HomePage() {
  const { vehicles: initialVehicles, reviews, soldPhotos } = Route.useLoaderData();
  const [vehicles, setVehicles] = useState<VehicleView[]>(initialVehicles);
  const [activeFilter, setActiveFilter] = useState<string>("tous");
  const isAdmin = useHasAdminToken();
  const settings = useSiteSettings();

  const list = vehicles.filter((v) => activeFilter === "tous" || v.type === activeFilter);
  const photos = soldPhotos.map((p) => p.url);

  function handleDeleted(id: string) {
    setVehicles((vs) => vs.filter((x) => x.id !== id));
  }

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          {photos.length > 0 && (
            <>
              <div className="hero-panorama" aria-hidden="true">
                <div className="hero-panorama-track">
                  {[...photos, ...photos].map((src, i) => (
                    <img key={i} src={src} alt="" />
                  ))}
                </div>
              </div>
              <div className="hero-panorama-badge">Véhicules vendus par JNN</div>
            </>
          )}
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">Vendeur professionnel — {settings.address}</span>
              <h1>
                Des occasions choisies.
                <br />
                Pas <em>improvisées</em>.
              </h1>
              <p>Chaque véhicule qui entre chez JNN est vérifié, préparé et vendu avec la même exigence.</p>
              <div className="hero-ctas">
                <a href="#stock" className="btn-primary">
                  Voir le stock
                  <span className="cta-count">{vehicles.length}</span>
                </a>
                <a href={appointmentWhatsAppUrl(settings.phone)} target="_blank" rel="noreferrer" className="btn-ghost">
                  Prendre rendez-vous
                </a>
              </div>
              <ul className="hero-perks">
                {["Faible kilométrage", "Excellent état", "Souvent 1er propriétaire"].map((perk) => (
                  <li key={perk}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
            <HeroReviewCard reviews={reviews} />
          </div>
        </section>

        <section id="stock">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2>Le stock actuel</h2>
                <p>Cliquez sur un véhicule pour voir la fiche complète, les photos et les équipements.</p>
              </div>
              <span className="tag-count">
                {list.length} {list.length === 1 ? "véhicule disponible" : "véhicules disponibles"}
              </span>
            </div>
            <div className="highlight-strip">
              🔑{" "}
              <span>
                <b>Chez JNN</b>, nous privilégions les véhicules à faible kilométrage, en excellent
                état, provenant le plus souvent d'un premier propriétaire.
              </span>
            </div>
            <div className="filters">
              <div className="filter-group">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    className={`filter-btn${activeFilter === f.key ? " active" : ""}`}
                    onClick={() => setActiveFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {isAdmin && (
                <a href="/admin/vehicules/new" className="btn-small">
                  + Ajouter un véhicule
                </a>
              )}
            </div>
            <div className="car-grid">
              {list.map((v) => (
                <VehicleCard key={v.id} vehicle={v} isAdmin={isAdmin} onDeleted={handleDeleted} />
              ))}
            </div>
          </div>
        </section>

        <section id="avis">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2>Ce que disent nos clients</h2>
                <p>Avis publiés par des clients ayant réellement acheté un véhicule chez JNN, recueillis sur AutoScout24.</p>
              </div>
            </div>
            <div className="avis-top">
              <div className="score-block">
                <div className="score-num">
                  4.8<span style={{ fontSize: 26, color: "var(--cream-dim)" }}>/5</span>
                </div>
                <div className="score-stars">★★★★★</div>
                <div className="score-sub">73 évaluations — 100% de recommandations</div>
              </div>
              <div>
                <p style={{ color: "var(--cream-dim)", fontSize: 15, margin: "0 0 6px" }}>
                  Les clients évaluent systématiquement JNN sur les points suivants :
                </p>
                <div className="criteria-list">
                  <span>Impression générale</span>
                  <span>Disponibilité</span>
                  <span>Fiabilité</span>
                  <span>Description de l'offre</span>
                  <span>Processus d'achat</span>
                  <span>Conseil</span>
                </div>
              </div>
            </div>
            <div className="reviews-track-wrap">
              <div className="reviews-track">
                {reviews.map((r) => (
                  <div className="review-card" key={r.id}>
                    <div className="stars">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</div>
                    <p>&quot;{r.body}&quot;</p>
                    <footer>
                      <span className="name">{r.author}</span>
                      <span>{r.review_date}</span>
                    </footer>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 26 }}>
              <a href="/avis" className="btn-primary">
                Voir les 73 avis clients →
              </a>
            </div>
            <p style={{ fontSize: 12, color: "var(--cream-dim)", marginTop: 18, opacity: 0.7, textAlign: "center" }}>
              Avis vérifiés, extraits de la page d'évaluations AutoScout24 de JNN.
            </p>
          </div>
        </section>

        <BizCardSection />

        <section id="contact">
          <div className="wrap contact-grid">
            <div>
              <h2>
                Venez voir
                <br />
                la voiture en vrai
              </h2>
              <div className="contact-line">
                <div>
                  <strong>Adresse</strong>
                  {settings.address}
                </div>
              </div>
              <div className="contact-line">
                <div>
                  <strong>Téléphone</strong>
                  <a href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`}>{settings.phone}</a>
                </div>
              </div>
              <div className="contact-line">
                <div>
                  <strong>Horaires</strong>
                  Du lundi au samedi — sur rendez-vous de préférence
                </div>
              </div>
              <a href="#stock" className="btn-primary" style={{ display: "inline-block", marginTop: 10 }}>
                Voir le stock
              </a>
            </div>
            <div className="map-box">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Localisation JNN — ${settings.address}`}
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
