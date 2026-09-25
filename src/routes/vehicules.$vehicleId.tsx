import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getVehicleById, recordVehicleEvent } from "~/server/functions";
import { powerLabel } from "~/lib/power";
import { fmtKm, fmtPrice } from "~/lib/config";
import { VehiclePhoto } from "~/components/CarPlaceholder";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { useHasAdminToken } from "~/lib/adminSession";
import { useSiteSettings } from "~/lib/siteSettings";

export const Route = createFileRoute("/vehicules/$vehicleId")({
  loader: async ({ params }) => {
    const vehicle = await getVehicleById({ data: params.vehicleId });
    if (!vehicle) throw notFound();
    return { vehicle };
  },
  component: VehiclePage,
});

function VehiclePage() {
  const { vehicle } = Route.useLoaderData();
  const [index, setIndex] = useState(0);
  const [extraMsg, setExtraMsg] = useState("");
  const isAdmin = useHasAdminToken();
  const settings = useSiteSettings();
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

  function link() {
    return typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "";
  }

  function contact(kind: "wa" | "mail") {
    recordVehicleEvent({ data: { vehicleId: vehicle.id, field: "contacts" } }).catch(() => {});
    const extra = extraMsg.trim();
    if (kind === "wa") {
      let msg = `Bonjour, je suis intéressé(e) par le véhicule ${vehicle.title} (${fmtPrice(vehicle.price)}) : ${link()}`;
      if (extra) msg += `\n\n${extra}`;
      window.open(
        `https://wa.me/${settings.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`,
        "_blank"
      );
    } else {
      let body = `Bonjour,\n\nJe souhaite avoir plus d'informations sur ce véhicule :\n${vehicle.title} — ${fmtPrice(vehicle.price)}\n${link()}`;
      if (extra) body += `\n\n${extra}`;
      window.location.href = `mailto:${settings.email}?subject=${encodeURIComponent(
        "Intéressé par " + vehicle.title + " — Réf. " + vehicle.id
      )}&body=${encodeURIComponent(body)}`;
    }
  }

  return (
    <>
      <Header />
      <main className="vehicle-page">
        <div className="wrap">
          <Link to="/" className="back-link">
            ← Retour au stock
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
                  Photo {index + 1} / {imgs.length}
                </span>
                {imgs.length > 1 && (
                  <div className="gallery-nav">
                    <button onClick={() => goTo(index - 1)}>‹</button>
                    <button onClick={() => goTo(index + 1)}>›</button>
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
              <p style={{ color: "var(--cream-dim)", fontSize: 15, marginBottom: 14 }}>{vehicle.sub}</p>
              <div className="modal-price">{fmtPrice(vehicle.price)}</div>
              <table className="spec-table">
                <tbody>
                  <tr>
                    <td>Référence</td>
                    <td>{vehicle.id}</td>
                  </tr>
                  <tr>
                    <td>Mise en circulation</td>
                    <td>{vehicle.first_reg}</td>
                  </tr>
                  <tr>
                    <td>Kilométrage</td>
                    <td>{fmtKm(vehicle.km)}</td>
                  </tr>
                  <tr>
                    <td>Carburant</td>
                    <td>{vehicle.fuel}</td>
                  </tr>
                  <tr>
                    <td>Puissance</td>
                    <td>{powerLabel(vehicle.kw)}</td>
                  </tr>
                  <tr>
                    <td>Boîte de vitesse</td>
                    <td>{vehicle.gearbox}</td>
                  </tr>
                  <tr>
                    <td>Couleur</td>
                    <td>{vehicle.color}</td>
                  </tr>
                </tbody>
              </table>
              <p className="modal-desc">
                <strong>Description —</strong> {vehicle.description} Mise en circulation : {vehicle.first_reg}.
              </p>
              {vehicle.options.length > 0 && (
                <>
                  <span className="options-title">Équipements</span>
                  <ul className="options-grid">
                    {vehicle.options.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </>
              )}
              <label>Message pour le vendeur (facultatif)</label>
              <textarea
                className="extra-msg-box"
                rows={2}
                placeholder="Ex : Est-elle toujours disponible ? Puis-je passer la voir samedi ?"
                value={extraMsg}
                onChange={(e) => setExtraMsg(e.target.value)}
              />
              <div className="modal-cta">
                <button className="btn-whatsapp" onClick={() => contact("wa")}>
                  💬 WhatsApp
                </button>
                <button className="btn-mail" onClick={() => contact("mail")}>
                  ✉ E-mail
                </button>
                {isAdmin && (
                  <Link to="/admin/vehicules/$vehicleId/edit" params={{ vehicleId: vehicle.id }} className="btn-small">
                    ✎ Modifier ce véhicule
                  </Link>
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
