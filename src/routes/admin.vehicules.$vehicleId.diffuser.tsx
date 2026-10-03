import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { getVehicleById, adminListListings, adminPublishListing, adminRemoveListing } from "~/server/functions";
import { getAdminToken } from "~/lib/adminSession";
import { useSiteSettings } from "~/lib/siteSettings";
import { showToast } from "~/lib/toast";
import { PLATFORMS, listingKit, listingStatus, type PlatformKey } from "~/lib/listingKit";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ListingCard } from "~/components/ListingCard";
import type { Listing } from "~/server/listings";

// Page admin « Diffuser » : pour une voiture, le texte prêt à copier sur
// chaque plateforme d'annonces et le suivi de ce qui y est publié.
export const Route = createFileRoute("/admin/vehicules/$vehicleId/diffuser")({
  loader: async ({ params }) => {
    const vehicle = await getVehicleById({ data: params.vehicleId });
    if (!vehicle) throw notFound();
    return { vehicle };
  },
  component: DiffuserPage,
});

function DiffuserPage() {
  const { vehicle } = Route.useLoaderData();
  const router = useRouter();
  const settings = useSiteSettings();
  const [lang, setLang] = useState<"fr" | "nl">("fr");
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [busy, setBusy] = useState(false);
  const photos = vehicle.images.filter((src) => /^https?:\/\//.test(src));

  async function reload() {
    const token = getAdminToken();
    if (!token) {
      router.navigate({ to: "/admin/login" });
      return;
    }
    try {
      setListings(await adminListListings({ data: { token } }));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Session expirée, reconnectez-vous.", true);
      router.navigate({ to: "/admin/login" });
    }
  }
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(action: (token: string) => Promise<unknown>, done: string) {
    const token = getAdminToken();
    if (!token) return;
    setBusy(true);
    try {
      await action(token);
      await reload();
      showToast(done);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de l'enregistrement.", true);
    } finally {
      setBusy(false);
    }
  }

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copié.`);
    } catch {
      showToast("Copie impossible : sélectionnez le texte et copiez-le à la main.", true);
    }
  }

  /** Télécharge les photos une par une ; si le navigateur refuse, les ouvre dans des onglets. */
  async function downloadPhotos() {
    for (const [i, src] of photos.entries()) {
      try {
        const blob = await fetch(src).then((r) => r.blob());
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${vehicle.id}-${String(i + 1).padStart(2, "0")}.jpg`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch {
        window.open(src, "_blank");
      }
    }
  }

  const find = (platform: PlatformKey) =>
    listings?.find((l) => l.vehicle_id === vehicle.id && l.platform === platform) ?? null;

  return (
    <>
      <Header />
      <main className="admin-page">
        <div className="wrap">
          <div className="admin-card wide">
            <Link to="/admin/dashboard" className="back-link">
              ← Tableau de bord
            </Link>
            <h2 style={{ fontSize: 22, margin: "10px 0 6px" }}>Diffuser {vehicle.title}</h2>
            <p style={{ color: "var(--cream-dim)", fontSize: 13, marginBottom: 14 }}>
              Pour chaque plateforme : copiez le titre, le texte et le lien dans l'annonce, ajoutez les photos, publiez,
              puis notez ici que c'est fait. Si vous modifiez ensuite la fiche (prix, texte, photos), l'annonce passera
              en « À mettre à jour » ; une fois la voiture vendue, en « À retirer ».
            </p>

            <div className="listing-toolbar">
              <div className="filter-group">
                {(["fr", "nl"] as const).map((l) => (
                  <button key={l} type="button" className={`filter-btn${lang === l ? " active" : ""}`} onClick={() => setLang(l)}>
                    {l === "fr" ? "Texte en français" : "Tekst in het Nederlands"}
                  </button>
                ))}
              </div>
              {photos.length > 0 && (
                <button type="button" className="btn-small" onClick={downloadPhotos}>
                  Télécharger les {photos.length} photos
                </button>
              )}
            </div>
            {photos.length === 0 && (
              <p className="listing-hint">Cette voiture n'a pas encore de vraies photos : ajoutez-les avant de publier.</p>
            )}

            {!listings ? (
              <p style={{ color: "var(--cream-dim)", fontSize: 13 }}>Chargement…</p>
            ) : (
              PLATFORMS.map((p) => {
                const listing = find(p.key);
                return (
                  <ListingCard
                    key={p.key}
                    name={p.name}
                    site={p.site}
                    status={listingStatus(vehicle, listing)}
                    kit={listingKit(vehicle, lang, p.key, settings)}
                    listingUrl={listing?.listing_url ?? null}
                    busy={busy}
                    onCopy={copy}
                    onPublished={(listingUrl) =>
                      act(
                        (token) => adminPublishListing({ data: { token, vehicleId: vehicle.id, platform: p.key, listingUrl } }),
                        `${p.name} : annonce notée comme publiée et à jour.`
                      )
                    }
                    onRemoved={() =>
                      act(
                        (token) => adminRemoveListing({ data: { token, vehicleId: vehicle.id, platform: p.key } }),
                        `${p.name} : annonce notée comme retirée.`
                      )
                    }
                  />
                );
              })
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
