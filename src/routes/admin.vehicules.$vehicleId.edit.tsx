import { useEffect } from "react";
import { createFileRoute, useRouter, notFound } from "@tanstack/react-router";
import { getVehicleById } from "~/server/functions";
import { getAdminToken } from "~/lib/adminSession";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { VehicleForm } from "~/components/VehicleForm";

export const Route = createFileRoute("/admin/vehicules/$vehicleId/edit")({
  loader: async ({ params }) => {
    const vehicle = await getVehicleById({ data: params.vehicleId });
    if (!vehicle) throw notFound();
    return { vehicle };
  },
  component: EditVehiclePage,
});

function EditVehiclePage() {
  const { vehicle } = Route.useLoaderData();
  const router = useRouter();
  useEffect(() => {
    if (!getAdminToken()) router.navigate({ to: "/admin/login" });
  }, [router]);

  return (
    <>
      <Header />
      <main className="admin-page">
        <div className="wrap">
          <div className="admin-card wide">
            <h2 style={{ fontSize: 22, marginBottom: 16 }}>Modifier {vehicle.title}</h2>
            <VehicleForm existing={vehicle} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
