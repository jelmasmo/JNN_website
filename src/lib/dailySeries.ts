// Série « une valeur par jour » pour le graphique des visites : chaque jour
// de la période, jusqu'à aujourd'hui, avec zéro pour les jours sans visite.
// Logique pure, testée dans tests/dailySeries.test.ts.

export interface DayVisits {
  day: string; // AAAA-MM-JJ (UTC)
  visits: number;
}

/** Les `days` derniers jours se terminant à `today` (AAAA-MM-JJ), du plus ancien au plus récent. */
export function dailySeries(byDay: DayVisits[], days: number, today: string): DayVisits[] {
  const counts = new Map(byDay.map((d) => [d.day, d.visits]));
  const end = Date.parse(`${today}T00:00:00Z`);
  const series: DayVisits[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(end - i * 86_400_000).toISOString().slice(0, 10);
    series.push({ day, visits: counts.get(day) ?? 0 });
  }
  return series;
}

/** Date du jour en UTC (les visites sont datées en UTC dans la base). */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
