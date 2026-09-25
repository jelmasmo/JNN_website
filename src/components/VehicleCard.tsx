import { useState, type UIEvent } from "react";
import { Link } from "@tanstack/react-router";
import { VehiclePhoto } from "./CarPlaceholder";
import { fmtKm, fmtPrice } from "~/lib/config";
import { powerLabel } from "~/lib/power";
import type { VehicleView } from "~/server/vehicles";

export function VehicleCard({ vehicle, isAdmin, onDelete }: { vehicle: VehicleView; isAdmin: boolean; onDelete?: (id: string) => void }) {
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
          <span className="plate-tag">REF. {vehicle.id}</span>
          <span className="badge">{vehicle.fuel}</span>
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
            {vehicle.sub} — {vehicle.color}
          </div>
          <div className="car-specs">
            <span>📅 {vehicle.first_reg}</span>
            <span>⏱ {fmtKm(vehicle.km)}</span>
            <span>⚙ {vehicle.gearbox}</span>
            <span>{powerLabel(vehicle.kw)}</span>
          </div>
          <div className="car-footer">
            <span className="price">{fmtPrice(vehicle.price)}</span>
            <span className="see-more">Voir la fiche</span>
          </div>
        </div>
      </Link>
      {isAdmin && (
        <div className="admin-tools">
          <Link to="/admin/vehicules/$vehicleId/edit" params={{ vehicleId: vehicle.id }} title="Modifier">
            ✎
          </Link>
          <button
            title="Supprimer"
            onClick={(e) => {
              e.preventDefault();
              onDelete?.(vehicle.id);
            }}
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
}
