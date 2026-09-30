import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { adminDeleteVehicle } from "~/server/functions";
import { getAdminToken } from "~/lib/adminSession";
import { showToast } from "~/lib/toast";

/**
 * Bouton « Supprimer » d'une annonce (espace pro), utilisé sur les cartes du
 * stock, la fiche véhicule et le formulaire de modification.
 *
 * La confirmation est une fenêtre intégrée à la page plutôt que le
 * `confirm()` du navigateur : celui-ci peut être bloqué silencieusement
 * (case « Empêcher cette page d'ouvrir d'autres boîtes de dialogue »), ce
 * qui annulait la suppression sans aucun message.
 */
export function DeleteVehicleButton({
  vehicle,
  onDeleted,
  className = "btn-danger",
  label = "Supprimer",
  iconOnly = false,
}: {
  vehicle: { id: string; title: string };
  onDeleted: () => void;
  className?: string;
  label?: string;
  /** Icône seule (libellé lu par les lecteurs d'écran et en info-bulle). */
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  async function confirmDelete() {
    const token = getAdminToken();
    if (!token) {
      showToast("Session expirée — reconnectez-vous à l'espace professionnel.", true);
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      await adminDeleteVehicle({ data: { token, id: vehicle.id } });
      showToast(`${vehicle.title} a été supprimé du stock.`);
      setOpen(false);
      onDeleted();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur lors de la suppression.", true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={iconOnly ? `${label} ${vehicle.title}` : undefined}
        title={iconOnly ? label : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
        </svg>
        {!iconOnly && label}
      </button>
      {open &&
        createPortal(
        <div className="confirm-backdrop" onClick={() => !busy && setOpen(false)}>
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`del-title-${vehicle.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={`del-title-${vehicle.id}`}>Supprimer cette annonce ?</h3>
            <p>
              <strong>{vehicle.title}</strong> (réf. {vehicle.id}) sera retiré définitivement du stock. Cette action
              est irréversible.
            </p>
            <p className="confirm-hint">Si le véhicule a été vendu, préférez « Marquer comme vendu » (via Modifier) : il sera retiré du stock public mais gardé dans vos statistiques.</p>
            <div className="confirm-actions">
              <button type="button" className="btn-small" onClick={() => setOpen(false)} disabled={busy} autoFocus>
                Annuler
              </button>
              <button type="button" className="btn-danger-solid" onClick={confirmDelete} disabled={busy}>
                {busy ? "Suppression…" : "Oui, supprimer"}
              </button>
            </div>
          </div>
        </div>,
          document.body
        )}
    </>
  );
}
