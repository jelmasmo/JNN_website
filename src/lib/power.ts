// Conversion kW -> chevaux (ch), utilisée sur les fiches véhicules.
// 1 kW = 1.35962 ch (facteur exact repris du prototype).
export function kwToCh(kw: number): number {
  return Math.round(kw * 1.35962);
}

export function powerLabel(kw: number | null | undefined): string {
  if (!kw) return "—";
  return `${kw} kW (${kwToCh(kw)} ch)`;
}
