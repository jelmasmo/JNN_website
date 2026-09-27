// Réorganisation de la liste de photos d'un véhicule (formulaire admin).

/** Échange la photo `i` avec sa voisine (`dir` = -1 gauche, +1 droite). */
export function moveImage<T>(list: T[], i: number, dir: 1 | -1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const copy = list.slice();
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

/** Déplace la photo `from` à la position `to` (glisser-déposer). */
export function reorderImages<T>(list: T[], from: number, to: number): T[] {
  const copy = list.slice();
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}
