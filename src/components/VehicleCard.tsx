import { Link } from "@tanstack/react-router";
import { VehiclePhoto } from "./CarPlaceholder";
import { fmtKm, fmtPrice } from "~/lib/config";
import { powerLabel } from "~/lib/power";
import type { VehicleView } from "~/server/vehicles";

export function VehicleCard({ vehicle, isAdmin, onDelete }: { vehicle: VehicleView; isAdmin: boolean; onDelete?: (id: string) => void }) {
  const img = vehicle.images?.[0];
  return (
    <div className="car-card">
      <Link to="/vehicules/$vehicleId" params={{ vehicleId: vehicle.id }} style={{ display: "block" }}>
        <div className="car-photo">
          <span className="plate-tag">REF. {vehicle.id}</span>
          <span className="badge">{vehicle.fuel}</span>
          <VehiclePhoto src={img} />
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
