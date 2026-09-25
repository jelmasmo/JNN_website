import { Link, useRouter } from "@tanstack/react-router";
import { OWNER } from "~/lib/config";
import { useHasAdminToken, clearAdminToken } from "~/lib/adminSession";
import { showToast } from "~/lib/toast";

export function Footer() {
  const isAdmin = useHasAdminToken();
  const router = useRouter();

  function logout() {
    clearAdminToken();
    showToast("Déconnecté.");
    router.navigate({ to: "/" });
  }

  return (
    <footer className="site-footer">
      <div className="wrap" style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
        <span>© JNN — {OWNER.address}</span>
        {!isAdmin && <Link to="/admin/login">Espace professionnel</Link>}
        {isAdmin && <Link to="/admin/dashboard">Tableau de bord</Link>}
        {isAdmin && <Link to="/admin/sold-photos">📷 Photos véhicules vendus</Link>}
        {isAdmin && <button onClick={logout}>Se déconnecter</button>}
      </div>
    </footer>
  );
}
