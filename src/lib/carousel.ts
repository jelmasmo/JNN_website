// Défilement circulaire (avis de la carte d'accueil) — logique pure.

/** Index de la diapositive suivante, en revenant au début après la dernière. */
export function nextSlide(current: number, count: number): number {
  if (count <= 0) return 0;
  return (current + 1) % count;
}
