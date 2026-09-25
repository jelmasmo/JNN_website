import { useState, type DragEvent, type FormEvent } from "react";
import { useRouter } from "@tanstack/react-router";
import { adminSaveVehicle, adminUploadPhoto, adminDeleteVehicle, adminMarkSold } from "~/server/functions";
import { getAdminToken } from "~/lib/adminSession";
import { showToast } from "~/lib/toast";
import { VehiclePhoto } from "~/components/CarPlaceholder";
import type { VehicleView } from "~/server/vehicles";

const FUELS = ["Essence", "Diesel", "Hybride", "Électrique", "GPL"];
const TYPES = [
  { value: "citadine", label: "Citadine" },
  { value: "berline", label: "Berline" },
  { value: "suv", label: "SUV" },
];

export function VehicleForm({ existing }: { existing?: VehicleView }) {
  const router = useRouter();
  const isNew = !existing;
  const [id, setId] = useState(existing?.id ?? "");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [sub, setSub] = useState(existing?.sub ?? "");
  const [type, setType] = useState(existing?.type ?? "citadine");
  const [firstReg, setFirstReg] = useState(existing?.first_reg ?? "");
  const [km, setKm] = useState(String(existing?.km ?? ""));
  const [fuel, setFuel] = useState(existing?.fuel ?? "Essence");
  const [gearbox, setGearbox] = useState(existing?.gearbox ?? "Manuelle");
  const [kw, setKw] = useState(String(existing?.kw ?? ""));
  const [color, setColor] = useState(existing?.color ?? "");
  const [price, setPrice] = useState(String(existing?.price ?? ""));
  const [description, setDescription] = useState(existing?.description ?? "");
  const [options, setOptions] = useState((existing?.options ?? []).join("\n"));
  const [images, setImages] = useState<string[]>(existing?.images?.filter((i) => i !== "placeholder") ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const token = getAdminToken();
    if (!token) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("token", token);
        fd.set("kind", "vehicles");
        fd.set("file", file);
        const res = await adminUploadPhoto({ data: fd });
        uploaded.push(res.url);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de l'envoi d'une photo.", true);
    } finally {
      setUploading(false);
    }
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }
  function moveImage(i: number, dir: 1 | -1) {
    setImages((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = prev.slice();
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  function reorderImages(from: number, to: number) {
    if (from === to) return;
    setImages((prev) => {
      const copy = prev.slice();
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }

  function handleDragStart(i: number) {
    setDragIndex(i);
  }
  function handleDragOver(e: DragEvent<HTMLDivElement>, i: number) {
    e.preventDefault();
    if (i !== overIndex) setOverIndex(i);
  }
  function handleDrop(i: number) {
    if (dragIndex !== null) reorderImages(dragIndex, i);
    setDragIndex(null);
    setOverIndex(null);
  }
  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const token = getAdminToken();
    if (!token) return;
    if (!id.trim()) return showToast("La référence est obligatoire.", true);
    setSaving(true);
    try {
      await adminSaveVehicle({
        data: {
          token,
          isNew,
          originalId: existing?.id,
          vehicle: {
            id: id.trim(),
            title: title.trim(),
            sub: sub.trim(),
            type,
            first_reg: firstReg.trim(),
            km: Number(km) || 0,
            fuel,
            gearbox,
            kw: Number(kw) || 0,
            color: color.trim(),
            price: Number(price) || 0,
            description: description.trim(),
            options: options.split("\n").map((s) => s.trim()).filter(Boolean),
            images: images.length ? images : ["placeholder"],
          },
        },
      });
      showToast(isNew ? "Véhicule ajouté avec succès." : "Véhicule mis à jour avec succès.");
      router.navigate({ to: "/admin/dashboard" });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.", true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    if (!confirm(`Supprimer ${existing.title} du stock ? Cette action est définitive.`)) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await adminDeleteVehicle({ data: { token, id: existing.id } });
      showToast("Véhicule supprimé.");
      router.navigate({ to: "/admin/dashboard" });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur lors de la suppression.", true);
    }
  }

  async function handleMarkSold() {
    if (!existing) return;
    if (!confirm(`Marquer ${existing.title} comme vendu ? Il disparaîtra du stock public.`)) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await adminMarkSold({ data: { token, id: existing.id } });
      showToast("Véhicule marqué comme vendu.");
      router.navigate({ to: "/admin/dashboard" });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur.", true);
    }
  }

  return (
    <form onSubmit={save}>
      <div className="field-row">
        <div>
          <label>Référence (unique)</label>
          <input value={id} onChange={(e) => setId(e.target.value)} />
        </div>
        <div>
          <label>Titre</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div>
          <label>Sous-titre</label>
          <input value={sub} onChange={(e) => setSub(e.target.value)} />
        </div>
        <div>
          <label>Catégorie</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field-row">
        <div>
          <label>Mise en circulation (MM/AAAA)</label>
          <input placeholder="03/2021" value={firstReg} onChange={(e) => setFirstReg(e.target.value)} />
        </div>
        <div>
          <label>Kilométrage</label>
          <input type="number" value={km} onChange={(e) => setKm(e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div>
          <label>Carburant</label>
          <select value={fuel} onChange={(e) => setFuel(e.target.value)}>
            {FUELS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Boîte de vitesse</label>
          <select value={gearbox} onChange={(e) => setGearbox(e.target.value)}>
            <option>Manuelle</option>
            <option>Automatique</option>
          </select>
        </div>
      </div>
      <div className="field-row">
        <div>
          <label>Puissance (kW)</label>
          <input type="number" value={kw} onChange={(e) => setKw(e.target.value)} />
        </div>
        <div>
          <label>Couleur</label>
          <input value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div>
          <label>Prix (€)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div />
      </div>
      <label>Description</label>
      <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      <label>Équipements (un par ligne)</label>
      <textarea rows={4} value={options} onChange={(e) => setOptions(e.target.value)} />
      <label>Photos</label>
      <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} disabled={uploading} />
      {uploading && <div style={{ fontSize: 12, color: "var(--brass)", marginTop: 6 }}>Envoi des photos…</div>}
      {images.length > 1 && (
        <div style={{ fontSize: 12, color: "var(--cream-dim)", marginTop: 8 }}>
          Glissez une photo pour la réordonner — la première sera la photo principale.
        </div>
      )}
      <div className="photo-input-row">
        {images.map((im, i) => (
          <div
            className={`photo-thumb-edit${i === overIndex && dragIndex !== null && dragIndex !== i ? " drag-over" : ""}${i === dragIndex ? " dragging" : ""}`}
            key={im + i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
          >
            <div className="thumb-img-wrap">
              <span className="order-num">{i + 1}</span>
              <button type="button" className="rm" onClick={() => removeImage(i)}>
                ×
              </button>
              <VehiclePhoto src={im} />
            </div>
            <div className="reorder-row">
              <button type="button" disabled={i === 0} onClick={() => moveImage(i, -1)}>
                ◀
              </button>
              <button type="button" disabled={i === images.length - 1} onClick={() => moveImage(i, 1)}>
                ▶
              </button>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <span style={{ fontSize: 12.5, color: "var(--cream-dim)" }}>Aucune photo — visuel générique utilisé par défaut</span>
        )}
      </div>
      <div className="modal-cta" style={{ marginTop: 20 }}>
        <button className="btn-primary" type="submit" disabled={saving || uploading}>
          💾 {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
        {existing && (
          <>
            <button type="button" className="btn-small" onClick={handleMarkSold}>
              ✅ Marquer comme vendu
            </button>
            <button type="button" className="btn-danger" onClick={handleDelete}>
              🗑 Supprimer
            </button>
          </>
        )}
      </div>
    </form>
  );
}
