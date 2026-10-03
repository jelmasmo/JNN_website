import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { useLang, useT } from "~/lib/lang";
import { nearbyTowns } from "~/lib/area";
import { trackVisit, useTrackPageView } from "~/lib/visitTracking";
import type { MessageKey } from "~/lib/messages";
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
  const lang = useLang();
  const tr = useT();
  const score = (4.8).toLocaleString(lang === "fr" ? "fr-BE" : lang === "nl" ? "nl-BE" : "en-GB");

  useTrackPageView("home_view");

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
              <div className="hero-panorama-badge">{tr("home.soldBadge")}</div>
            </>
          )}
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">{tr("home.eyebrow", { address: settings.address })}</span>
              <h1>
                {tr("home.title1")}
                <br />
                {tr("home.title2Before")}
                <em>{tr("home.title2Em")}</em>
                {tr("home.title2After")}
              </h1>
              <p>{tr("home.lead")}</p>
              <div className="hero-ctas">
                <a href="#stock" className="btn-primary">
                  {tr("home.seeStock")}
                  <span className="cta-count">{vehicles.length}</span>
                </a>
                <a
                  href={appointmentWhatsAppUrl(settings.phone, lang)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost"
                  onClick={() => trackVisit("contact_whatsapp")}
                >
                  {tr("home.appointment")}
                </a>
              </div>
              <ul className="hero-perks">
                {[tr("home.perkLowKm"), tr("home.perkCondition"), tr("home.perkFirstOwner")].map((perk) => (
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
                <h2>{tr("stock.title")}</h2>
                <p>{tr("stock.lead")}</p>
              </div>
              <span className="tag-count">
                {tr(list.length === 1 ? "stock.countOne" : "stock.countMany", { count: list.length })}
              </span>
            </div>
            <div className="highlight-strip">
              🔑{" "}
              <span>
                <b>{tr("stock.highlightBold")}</b>
                {tr("stock.highlightText")}
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
                    {tr(`filter.${f.key}` as MessageKey)}
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
                <h2>{tr("reviews.title")}</h2>
                <p>{tr("reviews.lead")}</p>
              </div>
            </div>
            <div className="avis-top">
              <div className="score-block">
                <div className="score-num">
                  {score}<span style={{ fontSize: 26, color: "var(--cream-dim)" }}>/5</span>
                </div>
                <div className="score-stars">★★★★★</div>
                <div className="score-sub">{tr("reviews.scoreSub", { count: 73 })}</div>
              </div>
              <div>
                <p style={{ color: "var(--cream-dim)", fontSize: 15, margin: "0 0 6px" }}>
                  {tr("reviews.criteriaIntro")}
                </p>
                <div className="criteria-list">
                  {(["reviews.criterion1", "reviews.criterion2", "reviews.criterion3", "reviews.criterion4", "reviews.criterion5", "reviews.criterion6"] as const).map((k) => (
                    <span key={k}>{tr(k)}</span>
                  ))}
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
              <Link to="/avis" className="btn-primary">
                {tr("reviews.seeAll", { count: 73 })}
              </Link>
            </div>
            <p style={{ fontSize: 12, color: "var(--cream-dim)", marginTop: 18, opacity: 0.7, textAlign: "center" }}>
              {tr("reviews.verified")} {tr("reviews.originalLanguage")}
            </p>
          </div>
        </section>

        <BizCardSection />

        {/* Zone desservie : situe JNN par rapport aux communes voisines,
            pour les visiteurs comme pour la recherche locale de Google. */}
        <section id="zone" className="area">
          <div className="wrap">
            <h2>{tr("area.title")}</h2>
            <p>{tr("area.text")}</p>
            <p className="area-label">{tr("area.townsLabel")}</p>
            <ul className="area-towns">
              {nearbyTowns(lang).map((town) => (
                <li key={town}>{town}</li>
              ))}
            </ul>
          </div>
        </section>

        <section id="contact">
          <div className="wrap contact-grid">
            <div>
              <h2>
                {tr("contact.title1")}
                <br />
                {tr("contact.title2")}
              </h2>
              <div className="contact-line">
                <div>
                  <strong>{tr("contact.address")}</strong>
                  {settings.address}
                </div>
              </div>
              <div className="contact-line">
                <div>
                  <strong>{tr("contact.phone")}</strong>
                  <a href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`}>{settings.phone}</a>
                </div>
              </div>
              <div className="contact-line">
                <div>
                  <strong>{tr("contact.hours")}</strong>
                  {tr("contact.hoursText")}
                </div>
              </div>
              <a href="#stock" className="btn-primary" style={{ display: "inline-block", marginTop: 10 }}>
                {tr("home.seeStock")}
              </a>
            </div>
            <div className="map-box">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed&hl=${lang}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={tr("contact.mapTitle", { address: settings.address })}
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
