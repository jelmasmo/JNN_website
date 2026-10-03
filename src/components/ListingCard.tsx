import { useState } from "react";
import { STATUS_LABELS, type ListingKit, type ListingStatus } from "~/lib/listingKit";

/**
 * Carte d'une plateforme sur la page « Diffuser » : état de l'annonce, texte
 * prêt à copier et boutons pour noter ce qui a été fait sur la plateforme.
 */
export function ListingCard({
  name,
  site,
  status,
  kit,
  listingUrl,
  busy,
  onCopy,
  onPublished,
  onRemoved,
}: {
  name: string;
  site: string;
  status: ListingStatus;
  kit: ListingKit;
  listingUrl: string | null;
  busy: boolean;
  onCopy: (label: string, text: string) => void;
  onPublished: (listingUrl: string | null) => void;
  onRemoved: () => void;
}) {
  const [url, setUrl] = useState("");
  return (
    <section className={`listing-card status-${status}`}>
      <header>
        <h3>{name}</h3>
        <span className="listing-status">{STATUS_LABELS[status]}</span>
        <a href={listingUrl ?? site} target="_blank" rel="noreferrer" className="listing-open">
          {listingUrl ? "Voir l'annonce ↗" : "Ouvrir le site ↗"}
        </a>
      </header>

      {status === "a_retirer" ? (
        <p className="listing-hint">
          Cette voiture n'est plus en vente : retirez l'annonce sur {name}, puis confirmez ici.
        </p>
      ) : (
        <>
          {status === "a_mettre_a_jour" && (
            <p className="listing-hint">
              La fiche a changé depuis la publication : recopiez le titre, le texte ou le prix sur {name}, puis confirmez ici.
            </p>
          )}
          <div className="listing-field">
            <label>Titre</label>
            <div className="listing-copy">
              <input readOnly value={kit.title} onFocus={(e) => e.currentTarget.select()} />
              <button type="button" className="btn-small" onClick={() => onCopy("Titre", kit.title)}>
                Copier
              </button>
            </div>
          </div>
          <div className="listing-field">
            <label>Texte de l'annonce</label>
            <div className="listing-copy top">
              <textarea readOnly rows={9} value={kit.text} onFocus={(e) => e.currentTarget.select()} />
              <button type="button" className="btn-small" onClick={() => onCopy("Texte", kit.text)}>
                Copier
              </button>
            </div>
          </div>
          <div className="listing-field">
            <label>Lien vers la fiche du site (à mettre dans l'annonce)</label>
            <div className="listing-copy">
              <input readOnly value={kit.url} onFocus={(e) => e.currentTarget.select()} />
              <button type="button" className="btn-small" onClick={() => onCopy("Lien", kit.url)}>
                Copier
              </button>
            </div>
          </div>
        </>
      )}

      <footer>
        {status === "absente" && (
          <>
            <input
              placeholder="Adresse de l'annonce publiée (facultatif)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button type="button" className="btn-small solid" disabled={busy} onClick={() => onPublished(url.trim() || null)}>
              Marquer comme publiée
            </button>
          </>
        )}
        {status === "a_mettre_a_jour" && (
          <button type="button" className="btn-small solid" disabled={busy} onClick={() => onPublished(null)}>
            J'ai mis l'annonce à jour
          </button>
        )}
        {status === "a_jour" && (
          <button type="button" className="btn-small" disabled={busy} onClick={onRemoved}>
            Marquer comme retirée
          </button>
        )}
        {status === "a_retirer" && (
          <button type="button" className="btn-small solid" disabled={busy} onClick={onRemoved}>
            J'ai retiré l'annonce
          </button>
        )}
      </footer>
    </section>
  );
}
