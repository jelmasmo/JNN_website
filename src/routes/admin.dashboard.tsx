import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  adminListVehicles,
  adminGetStats,
  adminChangePassword,
  getSiteSettings,
  adminUpdateSettings,
  adminTranslateVehicles,
  adminGetVisitReport,
  adminListListings,
  adminRemoveListing,
} from "~/server/functions";
import { getAdminToken, setAdminToken } from "~/lib/adminSession";
import { fmtPrice } from "~/lib/config";
import { showToast } from "~/lib/toast";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { DeleteVehicleButton } from "~/components/DeleteVehicleButton";
import { VisitsChart } from "~/components/VisitsChart";
import type { VehicleView } from "~/server/vehicles";
import type { VehicleStat } from "~/server/stats";
import type { VisitReport } from "~/server/visits";
import { sourceLabel } from "~/lib/trafficSource";
import { PLATFORMS, STATUS_LABELS, listingStatus } from "~/lib/listingKit";
import type { Listing } from "~/server/listings";

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
  const [translating, setTranslating] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reportDays, setReportDays] = useState(30);
  const [report, setReport] = useState<VisitReport | null>(null);

  // Rapport de provenance : rechargé quand on change de période.
  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    setReport(null);
    adminGetVisitReport({ data: { token, days: reportDays } })
      .then(setReport)
      .catch(() => showToast("Le rapport de provenance n'a pas pu être chargé.", true));
  }, [reportDays]);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.navigate({ to: "/admin/login" });
      return;
    }
    Promise.all([
      adminListVehicles({ data: { token } }),
      adminGetStats({ data: { token } }),
      getSiteSettings(),
      // Le suivi de diffusion ne doit pas bloquer le tableau de bord s'il échoue.
      adminListListings({ data: { token } }).catch((): Listing[] => []),
    ])
      .then(([v, s, settings, l]) => {
        setVehicles(v);
        setStats(s);
        setListings(l);
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

  /** Traduit en NL/EN les annonces du stock qui ne le sont pas encore (Workers AI). */
  async function translateListings() {
    const token = getAdminToken();
    if (!token) return;
    setTranslating(true);
    try {
      const { count } = await adminTranslateVehicles({ data: { token } });
      setVehicles(await adminListVehicles({ data: { token } }));
      showToast(count === 0 ? "Aucune annonce n'a pu être traduite — réessayez plus tard." : `${count} annonce(s) traduite(s) en néerlandais et en anglais.`, count === 0);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de la traduction.", true);
    } finally {
      setTranslating(false);
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

  // Suivi de diffusion : annonces publiées sur les plateformes qui demandent
  // une action (fiche modifiée depuis, voiture vendue ou supprimée).
  const platformName = (key: string) => PLATFORMS.find((p) => p.key === key)?.name ?? key;
  const listingRows = listings.map((l) => {
    const vehicle = vehicles.find((v) => v.id === l.vehicle_id) ?? null;
    return { listing: l, vehicle, status: listingStatus(vehicle, l) };
  });
  const listingTodos = listingRows.filter((r) => r.status !== "a_jour");
  const diffusionOf = (id: string) => {
    const rows = listingRows.filter((r) => r.listing.vehicle_id === id);
    return { published: rows.length, todo: rows.some((r) => r.status !== "a_jour") };
  };

  async function confirmRemoved(l: Listing) {
    const token = getAdminToken();
    if (!token) return;
    try {
      await adminRemoveListing({ data: { token, vehicleId: l.vehicle_id, platform: l.platform } });
      setListings((ls) => ls.filter((x) => !(x.vehicle_id === l.vehicle_id && x.platform === l.platform)));
      showToast(`${platformName(l.platform)} : annonce notée comme retirée.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de l'enregistrement.", true);
    }
  }

  const untranslated = vehicles.filter((v) => !v.sold_at && !(v.translations.nl && v.translations.en)).length;

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
                  <th className="dash-ref">Réf.</th>
                  <th>Prix</th>
                  <th>Vues</th>
                  <th>Messages</th>
                  <th>Diffusion</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td className="strong">
                      <div className="dash-vehicle">
                        <span>{v.title}</span>
                        <div className="dash-actions">
                          <Link
                            to="/admin/vehicules/$vehicleId/edit"
                            params={{ vehicleId: v.id }}
                            className="icon-action"
                            aria-label={`Modifier ${v.title}`}
                            title="Modifier"
                          >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </Link>
                          <DeleteVehicleButton
                            vehicle={v}
                            iconOnly
                            className="icon-action danger"
                            onDeleted={() => setVehicles((vs) => (vs ? vs.filter((x) => x.id !== v.id) : vs))}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="dash-ref">{v.id}</td>
                    <td className="dash-num">{fmtPrice(v.price)}</td>
                    <td className="dash-num">{statFor(v.id)?.views ?? 0}</td>
                    <td className="dash-num">{statFor(v.id)?.contacts ?? 0}</td>
                    <td className="dash-num">
                      <Link
                        to="/admin/vehicules/$vehicleId/diffuser"
                        params={{ vehicleId: v.id }}
                        className={`dash-diffusion${diffusionOf(v.id).todo ? " todo" : diffusionOf(v.id).published ? " ok" : ""}`}
                        title="Diffuser cette annonce sur les plateformes"
                      >
                        <span className="dot" aria-hidden="true" />
                        {diffusionOf(v.id).published}/{PLATFORMS.length}
                        {diffusionOf(v.id).todo ? " · à faire" : ""}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="divider-h" />
            <h3 style={{ fontSize: 18, marginBottom: 10 }}>Diffusion sur les plateformes</h3>
            <p style={{ color: "var(--cream-dim)", fontSize: 13, marginBottom: 12 }}>
              Cliquez sur « Diffusion » dans la ligne d'une voiture pour obtenir le texte prêt à copier sur AutoScout24,
              2ememain, Facebook Marketplace et Gocar, et noter où l'annonce est publiée.{" "}
              {listingTodos.length === 0
                ? "Aucune annonce publiée ne demande d'action pour l'instant."
                : `${listingTodos.length} annonce(s) demandent une action :`}
            </p>
            {listingTodos.length > 0 && (
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Véhicule</th>
                    <th>Plateforme</th>
                    <th>À faire</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {listingTodos.map(({ listing, vehicle, status }) => (
                    <tr key={`${listing.vehicle_id}-${listing.platform}`}>
                      <td className="strong">{vehicle?.title ?? listing.vehicle_title}</td>
                      <td>{platformName(listing.platform)}</td>
                      <td>{STATUS_LABELS[status]}</td>
                      <td className="dash-num">
                        {vehicle ? (
                          <Link to="/admin/vehicules/$vehicleId/diffuser" params={{ vehicleId: vehicle.id }} className="btn-small">
                            Ouvrir
                          </Link>
                        ) : (
                          <button type="button" className="btn-small" onClick={() => confirmRemoved(listing)}>
                            J'ai retiré l'annonce
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="divider-h" />
            <h3 style={{ fontSize: 18, marginBottom: 10 }}>Provenance des visiteurs</h3>
            <p style={{ color: "var(--cream-dim)", fontSize: 13, marginBottom: 12 }}>
              D'où viennent vos visiteurs et quelles voitures les intéressent. Vos propres visites (quand vous
              êtes connecté à l'espace professionnel) ne sont pas comptées. Pour reconnaître un lien que vous
              partagez, ajoutez <code>?src=…</code> à la fin : par exemple <code>?src=whatsapp</code>,{" "}
              <code>?src=autoscout24</code> ou <code>?src=qr</code>.
            </p>
            <div className="filter-group" style={{ marginBottom: 14 }}>
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`filter-btn${reportDays === d ? " active" : ""}`}
                  onClick={() => setReportDays(d)}
                >
                  {d} jours
                </button>
              ))}
            </div>
            {!report ? (
              <p style={{ color: "var(--cream-dim)", fontSize: 13 }}>Chargement du rapport…</p>
            ) : report.totals.visits === 0 && report.totals.vehicleViews === 0 ? (
              <p style={{ color: "var(--cream-dim)", fontSize: 13 }}>Aucune visite enregistrée sur cette période pour l'instant.</p>
            ) : (
              <>
                <div className="dash-totals">
                  <div className="box">
                    <div className="n">{report.totals.visits}</div>
                    <div className="l">Visites</div>
                  </div>
                  <div className="box">
                    <div className="n">{report.totals.vehicleViews}</div>
                    <div className="l">Fiches consultées</div>
                  </div>
                  <div className="box">
                    <div className="n">{report.totals.contacts}</div>
                    <div className="l">Prises de contact</div>
                  </div>
                </div>
                <VisitsChart byDay={report.byDay} days={reportDays} />
                <table className="dash-table dash-report">
                  <thead>
                    <tr>
                      <th>Provenance</th>
                      <th className="dash-num">Visites</th>
                      <th className="dash-num">Contacts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.bySource.map((row) => (
                      <tr key={row.source}>
                        <td className="strong">{sourceLabel(row.source)}</td>
                        <td className="dash-num">{row.visits}</td>
                        <td className="dash-num">{row.contacts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table className="dash-table dash-report">
                  <thead>
                    <tr>
                      <th>Véhicule le plus regardé</th>
                      <th className="dash-num">Vues</th>
                      <th className="dash-num">Contacts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byVehicle.slice(0, 10).map((row) => (
                      <tr key={row.vehicle_id}>
                        <td className="strong">{vehicles.find((v) => v.id === row.vehicle_id)?.title ?? row.vehicle_id}</td>
                        <td className="dash-num">{row.views}</td>
                        <td className="dash-num">{row.contacts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table className="dash-table dash-report">
                  <thead>
                    <tr>
                      <th>Ville des visiteurs (estimation)</th>
                      <th className="dash-num">Visites</th>
                      <th aria-hidden="true" />
                    </tr>
                  </thead>
                  <tbody>
                    {report.byPlace.map((row) => (
                      <tr key={`${row.country}-${row.city}`}>
                        <td className="strong">{[row.city, row.country].filter(Boolean).join(", ") || "Inconnue"}</td>
                        <td className="dash-num">{row.visits}</td>
                        <td aria-hidden="true" />
                      </tr>
                    ))}
                  </tbody>
                </table>

              </>
            )}
            <div className="divider-h" />
            <h3 style={{ fontSize: 18, marginBottom: 10 }}>Traduction des annonces (NL / EN)</h3>
            <p style={{ color: "var(--cream-dim)", fontSize: 13, marginBottom: 12 }}>
              Le site s'affiche en français, néerlandais ou anglais selon la langue du visiteur. Les textes
              que vous saisissez (sous-titre, couleur, description, équipements) sont traduits
              automatiquement à chaque enregistrement d'une annonce.{" "}
              {untranslated > 0
                ? `${untranslated} annonce(s) du stock ne sont pas encore traduites (elles s'affichent en français pour tous les visiteurs).`
                : "Toutes les annonces du stock sont traduites."}
            </p>
            {untranslated > 0 && (
              <button className="btn-small" type="button" onClick={translateListings} disabled={translating}>
                {translating ? "Traduction en cours… (quelques secondes par annonce)" : "Traduire les annonces maintenant"}
              </button>
            )}
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
