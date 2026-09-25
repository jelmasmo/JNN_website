import { useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getAdminToken } from "~/lib/adminSession";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { VehicleForm } from "~/components/VehicleForm";

export const Route = createFileRoute("/admin/vehicules/new")({
  component: NewVehiclePage,
});

function NewVehiclePage() {
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
            <h2 style={{ fontSize: 22, marginBottom: 16 }}>Ajouter un véhicule</h2>
            <VehicleForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
