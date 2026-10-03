import { useState, type UIEvent } from "react";
import { Link } from "@tanstack/react-router";
import { VehiclePhoto } from "./CarPlaceholder";
import { DeleteVehicleButton } from "./DeleteVehicleButton";
import { fmtKm, fmtPrice } from "~/lib/config";
import { powerLabel } from "~/lib/power";
import type { VehicleView } from "~/server/vehicles";
import { useLang, useT } from "~/lib/lang";
import { localizeVehicle } from "~/lib/localizeVehicle";

export function VehicleCard({ vehicle, isAdmin, onDeleted }: { vehicle: VehicleView; isAdmin: boolean; onDeleted?: (id: string) => void }) {
  const lang = useLang();
  const tr = useT();
  const shown = localizeVehicle(vehicle, lang);
  const imgs = vehicle.images && vehicle.images.length ? vehicle.images : ["placeholder"];
  const [dot, setDot] = useState(0);

  function handleScroll(e: UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setDot(Math.max(0, Math.min(imgs.length - 1, i)));
  }

  return (
    <div className="car-card">
      <Link to="/vehicules/$vehicleId" params={{ vehicleId: vehicle.id }} style={{ display: "block" }}>
        <div className="car-photo">
          <span className="plate-tag">
            {tr("card.ref")} {vehicle.id}
          </span>
          <span className="badge">{shown.fuel}</span>
          <div className="car-photo-track" onScroll={handleScroll}>
            {imgs.map((im, i) => (
              <div className="car-photo-slide" key={i}>
                <VehiclePhoto src={im} />
              </div>
            ))}
          </div>
          {imgs.length > 1 && (
            <div className="car-photo-dots">
              {imgs.map((_, i) => (
                <span key={i} className={`dot${i === dot ? " active" : ""}`} />
              ))}
            </div>
          )}
        </div>
        <div className="car-body">
          <h3>{vehicle.title}</h3>
          <div className="car-sub">
            {shown.sub} — {shown.color}
          </div>
          <div className="car-specs">
            <span>📅 {vehicle.first_reg}</span>
            <span>⏱ {fmtKm(vehicle.km, lang)}</span>
            <span>⚙ {shown.gearbox}</span>
            <span>{powerLabel(vehicle.kw, lang)}</span>
          </div>
          <div className="car-footer">
            <span className="price">{fmtPrice(vehicle.price, lang)}</span>
            <span className="see-more">{tr("card.seeDetails")}</span>
          </div>
        </div>
      </Link>
      {isAdmin && (
        <div className="card-admin-bar">
          <Link to="/admin/vehicules/$vehicleId/edit" params={{ vehicleId: vehicle.id }} className="card-admin-btn">
            ✎ Modifier
          </Link>
          <DeleteVehicleButton
            vehicle={vehicle}
            className="card-admin-btn danger"
            onDeleted={() => onDeleted?.(vehicle.id)}
          />
        </div>
      )}
    </div>
  );
}
