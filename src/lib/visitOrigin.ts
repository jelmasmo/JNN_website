// Origine d'une visite : à l'arrivée d'un visiteur, on retient d'où il
// vient (site d'origine, étiquette ?src=… du lien) pour toute la durée de sa
// visite, afin d'attribuer ses vues et ses prises de contact à cette
// provenance. Rien n'est conservé après la fermeture de l'onglet.
// Logique pure, testée dans tests/visitTracking.test.ts.

const STORAGE_KEY = "jnn_visit_origin";

export interface VisitOrigin {
  referrer: string;
  src: string | null;
  /** Vrai pour la première page vue pendant cette visite. */
  isEntry: boolean;
}

/** Origine de la visite en cours : lue en mémoire de session, ou fixée à l'arrivée. */
export function visitOrigin(
  storage: Pick<Storage, "getItem" | "setItem">,
  page: { referrer: string; search: string }
): VisitOrigin {
  try {
    const saved = storage.getItem(STORAGE_KEY);
    if (saved) {
      const { referrer, src } = JSON.parse(saved) as { referrer: string; src: string | null };
      return { referrer, src, isEntry: false };
    }
  } catch {
    // Mémoire de session indisponible ou illisible : on traite la page comme une arrivée.
  }
  const params = new URLSearchParams(page.search);
  const origin = { referrer: page.referrer, src: params.get("src") || params.get("utm_source") || null };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(origin));
  } catch {
    // Idem : sans mémoire de session, chaque page comptera comme une arrivée.
  }
  return { ...origin, isEntry: true };
}
