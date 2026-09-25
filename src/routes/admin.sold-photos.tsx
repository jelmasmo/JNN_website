import { useEffect, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { adminListSoldPhotos, adminUploadPhoto, adminAddSoldPhoto, adminRemoveSoldPhoto } from "~/server/functions";
import { getAdminToken } from "~/lib/adminSession";
import { showToast } from "~/lib/toast";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

export const Route = createFileRoute("/admin/sold-photos")({
  component: SoldPhotosPage,
});

interface SoldPhoto {
  id: number;
  url: string;
  position: number;
}

function SoldPhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<SoldPhoto[] | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.navigate({ to: "/admin/login" });
      return;
    }
    adminListSoldPhotos().then(setPhotos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length || !photos) return;
    const token = getAdminToken();
    if (!token) return;
    setUploading(true);
    try {
      let position = photos.length;
      const added: SoldPhoto[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("token", token);
        fd.set("kind", "sold");
        fd.set("file", file);
        const { url } = await adminUploadPhoto({ data: fd });
        await adminAddSoldPhoto({ data: { token, url, position } });
        added.push({ id: -position, url, position });
        position += 1;
      }
      const fresh = await adminListSoldPhotos();
      setPhotos(fresh);
      showToast("Photos enregistrées — le fond de la page d'accueil est mis à jour.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de l'envoi.", true);
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: number) {
    const token = getAdminToken();
    if (!token) return;
    try {
      await adminRemoveSoldPhoto({ data: { token, id } });
      setPhotos((prev) => prev?.filter((p) => p.id !== id) ?? null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur.", true);
    }
  }

  if (!photos) {
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

  return (
    <>
      <Header />
      <main className="admin-page">
        <div className="wrap">
          <div className="admin-card wide">
            <h2 style={{ fontSize: 22, marginBottom: 16 }}>Photos véhicules vendus</h2>
            <div className="note-box">
              Ces photos défilent discrètement en fond de la page d'accueil (un dégradé sombre garantit
              que le texte reste lisible). Utilisez de préférence des photos de véhicules réellement
              vendus par JNN, en format paysage si possible.
            </div>
            <label>Ajouter des photos</label>
            <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} disabled={uploading} />
            {uploading && <div style={{ fontSize: 12, color: "var(--brass)", marginTop: 6 }}>Envoi en cours…</div>}
            <div className="photo-input-row" style={{ marginTop: 16 }}>
              {photos.map((p) => (
                <div className="photo-thumb-edit" key={p.id}>
                  <div className="thumb-img-wrap">
                    <button type="button" className="rm" onClick={() => remove(p.id)}>
                      ×
                    </button>
                    <img src={p.url} alt="" />
                  </div>
                </div>
              ))}
              {photos.length === 0 && <div style={{ color: "var(--cream-dim)", fontSize: 13 }}>Aucune photo pour le moment.</div>}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
