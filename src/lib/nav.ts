// Onglet du menu principal à mettre en avant selon la page affichée —
// logique pure, testée dans tests/nav.test.ts.

export type NavKey = "stock" | "avis" | "carte" | "contact";

export function activeNavKey(pathname: string): NavKey | null {
  if (pathname === "/avis" || pathname.startsWith("/avis/")) return "avis";
  if (pathname.startsWith("/vehicules/")) return "stock";
  return null;
}
