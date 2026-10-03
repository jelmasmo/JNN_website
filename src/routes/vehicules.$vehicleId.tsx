import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { getVehicleById, recordVehicleEvent } from "~/server/functions";
import { powerLabel } from "~/lib/power";
import { fmtKm, fmtPrice } from "~/lib/config";
import { VehiclePhoto } from "~/components/CarPlaceholder";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { NotFound } from "~/components/NotFound";
import { DeleteVehicleButton } from "~/components/DeleteVehicleButton";
import { useHasAdminToken } from "~/lib/adminSession";
import { useSiteSettings } from "~/lib/siteSettings";
import { vehicleWhatsAppUrl, vehicleMailUrl } from "~/lib/contactLinks";
import { useLang, useT } from "~/lib/lang";
import { localizeVehicle } from "~/lib/localizeVehicle";
import { vehicleHead, vehicleJsonLd } from "~/lib/seo";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "~/lib/siteSettings";
import type { Lang } from "~/lib/i18n";
import { trackVisit, useTrackPageView } from "~/lib/visitTracking";

export const Route = createFileRoute("/vehicules/$vehicleId")({
  loader: async ({ params }) => {
    const vehicle = await getVehicleById({ data: params.vehicleId });
    if (!vehicle) throw notFound();
    return { vehicle };
  },
  // Aperçu de la fiche quand son lien est partagé (WhatsApp, Facebook…) et
  // données structurées lues par Google. La langue et les coordonnées
  // viennent de la route racine (cookie / langue du navigateur).
  head: ({ loaderData, matches }) => {
    if (!loaderData) return {};
    const root = matches[0]?.loaderData as { lang?: Lang; settings?: SiteSettings } | undefined;
    const lang = root?.lang ?? "fr";
    const page = vehicleHead(loaderData.vehicle, lang);
    return {
      meta: [
        { title: page.title },
        { name: "description", content: page.description },
        { property: "og:type", content: "product" },
        { property: "og:title", content: page.title },
        { property: "og:description", content: page.description },
        { property: "og:url", content: page.url },
        { property: "og:image", content: page.image },
        { property: "og:image:alt", content: loaderData.vehicle.title },
        // Dimensions inconnues pour les photos du véhicule : on retire
        // celles (1200×630) de la carte de visite déclarées à la racine.
        { property: "og:image:width", content: undefined },
        { property: "og:image:height", content: undefined },
        { "script:ld+json": vehicleJsonLd(loaderData.vehicle, lang, root?.settings ?? DEFAULT_SITE_SETTINGS) },
      ],
    };
  },
  component: VehiclePage,
  notFoundComponent: () => <NotFound vehicle />,
});

function VehiclePage() {
  const { vehicle } = Route.useLoaderData();
  const [index, setIndex] = useState(0);
  const [extraMsg, setExtraMsg] = useState("");
  const isAdmin = useHasAdminToken();
  const navigate = useNavigate();
  const settings = useSiteSettings();
  const lang = useLang();
  const tr = useT();
  const shown = localizeVehicle(vehicle, lang);
  const imgs = vehicle.images && vehicle.images.length ? vehicle.images : ["placeholder"];
  const trackRef = useRef<HTMLDivElement>(null);

  function goTo(i: number) {
    const el = trackRef.current;
    if (!el) return;
    const clamped = (i + imgs.length) % imgs.length;
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  }

  function handleTrackScroll() {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIndex(Math.max(0, Math.min(imgs.length - 1, i)));
  }

  useEffect(() => {
    recordVehicleEvent({ data: { vehicleId: vehicle.id, field: "views" } }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle.id]);

  useTrackPageView("vehicle_view", vehicle.id);

  function link() {
    return typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "";
  }

  function contact(kind: "wa" | "mail") {
    recordVehicleEvent({ data: { vehicleId: vehicle.id, field: "contacts" } }).catch(() => {});
    trackVisit(kind === "wa" ? "contact_whatsapp" : "contact_email", vehicle.id);
    if (kind === "wa") {
      window.open(vehicleWhatsAppUrl(vehicle, settings.phone, link(), extraMsg, lang), "_blank");
    } else {
      window.location.href = vehicleMailUrl(vehicle, settings.email, link(), extraMsg, lang);
    }
  }

  return (
    <>
      <Header />
      <main className="vehicle-page">
        <div className="wrap">
          <Link to="/" className="back-link">
            {tr("vehicle.back")}
          </Link>
          <div className="vehicle-grid">
            <div>
              <div className="gallery-main">
                <div className="gallery-track" ref={trackRef} onScroll={handleTrackScroll}>
                  {imgs.map((im, i) => (
                    <div className="gallery-slide" key={i}>
                      <VehiclePhoto src={im} />
                    </div>
                  ))}
                </div>
                <span className="idx">
                  {tr("vehicle.photoIndex", { n: index + 1, total: imgs.length })}
                </span>
                {imgs.length > 1 && (
                  <div className="gallery-nav">
                    <button onClick={() => goTo(index - 1)} aria-label={tr("vehicle.prevPhoto")}>
                      ‹
                    </button>
                    <button onClick={() => goTo(index + 1)} aria-label={tr("vehicle.nextPhoto")}>
                      ›
                    </button>
                  </div>
                )}
              </div>
              {imgs.length > 1 && (
                <div className="thumb-row">
                  {imgs.map((im, i) => (
                    <div key={i} className={`thumb${i === index ? " active" : ""}`} onClick={() => goTo(i)}>
                      <VehiclePhoto src={im} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-info">
              <h1 style={{ fontSize: 24, marginBottom: 4 }}>{vehicle.title}</h1>
              <p style={{ color: "var(--cream-dim)", fontSize: 15, marginBottom: 14 }}>{shown.sub}</p>
              <div className="modal-price">{fmtPrice(vehicle.price, lang)}</div>
              <table className="spec-table">
                <tbody>
                  <tr>
                    <td>{tr("vehicle.reference")}</td>
                    <td>{vehicle.id}</td>
                  </tr>
                  <tr>
                    <td>{tr("vehicle.firstReg")}</td>
                    <td>{vehicle.first_reg}</td>
                  </tr>
                  <tr>
                    <td>{tr("vehicle.mileage")}</td>
                    <td>{fmtKm(vehicle.km, lang)}</td>
                  </tr>
                  <tr>
                    <td>{tr("vehicle.fuel")}</td>
                    <td>{shown.fuel}</td>
                  </tr>
                  <tr>
                    <td>{tr("vehicle.power")}</td>
                    <td>{powerLabel(vehicle.kw, lang)}</td>
                  </tr>
                  <tr>
                    <td>{tr("vehicle.gearbox")}</td>
                    <td>{shown.gearbox}</td>
                  </tr>
                  <tr>
                    <td>{tr("vehicle.color")}</td>
                    <td>{shown.color}</td>
                  </tr>
                </tbody>
              </table>
              <p className="modal-desc">
                <strong>{tr("vehicle.description")}</strong> {shown.description}{" "}
                {tr("vehicle.firstRegSentence", { date: vehicle.first_reg ?? "—" })}
              </p>
              {shown.options.length > 0 && (
                <>
                  <span className="options-title">{tr("vehicle.equipment")}</span>
                  <ul className="options-grid">
                    {shown.options.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </>
              )}
              <label>{tr("vehicle.messageLabel")}</label>
              <textarea
                className="extra-msg-box"
                rows={2}
                placeholder={tr("vehicle.messagePlaceholder")}
                value={extraMsg}
                onChange={(e) => setExtraMsg(e.target.value)}
              />
              <div className="modal-cta">
                <button className="btn-whatsapp" onClick={() => contact("wa")}>
                  💬 WhatsApp
                </button>
                <button className="btn-mail" onClick={() => contact("mail")}>
                  ✉ {tr("vehicle.email")}
                </button>
                {isAdmin && (
                  <>
                    <Link to="/admin/vehicules/$vehicleId/edit" params={{ vehicleId: vehicle.id }} className="btn-small">
                      ✎ Modifier ce véhicule
                    </Link>
                    <DeleteVehicleButton
                      vehicle={vehicle}
                      label="Supprimer l'annonce"
                      onDeleted={() => navigate({ to: "/" })}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
