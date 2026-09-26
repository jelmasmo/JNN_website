import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { adminListVehicles, adminGetStats, adminChangePassword, getSiteSettings, adminUpdateSettings } from "~/server/functions";
import { getAdminToken, setAdminToken } from "~/lib/adminSession";
import { fmtPrice } from "~/lib/config";
import { showToast } from "~/lib/toast";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import type { VehicleView } from "~/server/vehicles";
import type { VehicleStat } from "~/server/stats";

export const Route = createFileRoute("/admin/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<VehicleView[] | null>(null);
  const [stats, setStats] = useState<VehicleStat[]>([]);
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.navigate({ to: "/admin/login" });
      return;
    }
    Promise.all([adminListVehicles({ data: { token } }), adminGetStats({ data: { token } }), getSiteSettings()])
      .then(([v, s, settings]) => {
        setVehicles(v);
        setStats(s);
        setPhone(settings.phone);
        setEmail(settings.email);
        setAddress(settings.address);
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : "Session expirée, reconnectez-vous.", true);
        router.navigate({ to: "/admin/login" });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    const token = getAdminToken();
    if (!token) return;
    setSavingSettings(true);
    try {
      await adminUpdateSettings({ data: { token, phone: phone.trim(), email: email.trim(), address: address.trim() } });
      await router.invalidate();
      showToast("Coordonnées mises à jour.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de la mise à jour.", true);
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveCreds(e: FormEvent) {
    e.preventDefault();
    const token = getAdminToken();
    if (!token || !newUser.trim() || !newPass) return;
    try {
      const res = await adminChangePassword({ data: { token, newUsername: newUser.trim(), newPassword: newPass } });
      setAdminToken(res.token);
      showToast("Identifiants mis à jour.");
      setNewPass("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de la mise à jour.", true);
    }
  }

  if (!vehicles) {
    return (
      <>
        <Header />
        <main className="admin-page">
          <div className="wrap">Chargement…</div>
        </main>
        <Footer />
      </>
    );
  }

  const statFor = (id: string) => stats.find((s) => s.vehicle_id === id);
  const totalViews = stats.reduce((a, s) => a + (s.views || 0), 0);
  const totalContacts = stats.reduce((a, s) => a + (s.contacts || 0), 0);

  return (
    <>
      <Header />
      <main className="admin-page">
        <div className="wrap">
          <div className="admin-card wide">
            <h2 style={{ fontSize: 24, marginBottom: 16 }}>Tableau de bord</h2>
            <div className="dash-totals">
              <div className="box">
                <div className="n">{vehicles.length}</div>
                <div className="l">Véhicules en stock</div>
              </div>
              <div className="box">
                <div className="n">{totalViews}</div>
                <div className="l">Vues fiches</div>
              </div>
              <div className="box">
                <div className="n">{totalContacts}</div>
                <div className="l">Messages envoyés</div>
              </div>
            </div>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Véhicule</th>
                  <th>Réf.</th>
                  <th>Prix</th>
                  <th>Vues</th>
                  <th>Messages</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td className="strong">{v.title}</td>
                    <td>{v.id}</td>
                    <td>{fmtPrice(v.price)}</td>
                    <td>{statFor(v.id)?.views ?? 0}</td>
                    <td>{statFor(v.id)?.contacts ?? 0}</td>
                    <td>
                      <div className="dash-actions">
                        <Link to="/admin/vehicules/$vehicleId/edit" params={{ vehicleId: v.id }} className="btn-small">
                          Modifier
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="divider-h" />
            <h3 style={{ fontSize: 18, marginBottom: 10 }}>Coordonnées de contact</h3>
            <p style={{ color: "var(--cream-dim)", fontSize: 13, marginBottom: 4 }}>
              Utilisées pour le bouton "Contact" (e-mail + appel), le bouton WhatsApp des fiches
              véhicules, la carte de visite et l'adresse affichée sur le site.
            </p>
            <form onSubmit={saveSettings}>
              <div className="field-row">
                <div>
                  <label>Numéro de téléphone</label>
                  <input placeholder="+32 470 00 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label>Adresse e-mail (bouton Contact)</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <label>Adresse de la société</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} />
              <button className="btn-small" type="submit" disabled={savingSettings} style={{ marginTop: 14 }}>
                {savingSettings ? "Enregistrement..." : "Enregistrer les coordonnées"}
              </button>
            </form>
            <div className="divider-h" />
            <h3 style={{ fontSize: 18, marginBottom: 10 }}>Changer le mot de passe</h3>
            <form onSubmit={saveCreds}>
              <div className="field-row">
                <div>
                  <label>Nouvel identifiant</label>
                  <input value={newUser} onChange={(e) => setNewUser(e.target.value)} />
                </div>
                <div>
                  <label>Nouveau mot de passe</label>
                  <input type="text" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                </div>
              </div>
              <button className="btn-small" type="submit" style={{ marginTop: 14 }}>
                Enregistrer les identifiants
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
