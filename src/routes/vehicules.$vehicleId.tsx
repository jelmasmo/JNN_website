import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getVehicleById } from "~/server/functions";
import { powerLabel } from "~/lib/power";

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

  return (
    <main>
      <Link to="/">← Retour au stock</Link>
      <h1>{vehicle.title}</h1>
      <p>{vehicle.sub}</p>
      <ul>
        <li>Première immatriculation : {vehicle.first_reg}</li>
        <li>Kilométrage : {vehicle.km.toLocaleString("fr-BE")} km</li>
        <li>Carburant : {vehicle.fuel}</li>
        <li>Boîte : {vehicle.gearbox}</li>
        <li>Puissance : {powerLabel(vehicle.kw)}</li>
        <li>Couleur : {vehicle.color}</li>
      </ul>
      <p className="price">{vehicle.price.toLocaleString("fr-BE")} €</p>
      <p>{vehicle.description}</p>
      <h3>Équipements</h3>
      <ul>
        {vehicle.options.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>
    </main>
  );
}
