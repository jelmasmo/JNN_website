import { dailySeries, todayUtc, type DayVisits } from "~/lib/dailySeries";

const W = 720;
const H = 200;
const PAD = { top: 14, right: 8, bottom: 26, left: 34 };

const shortDate = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/** Graduation haute de l'axe : un nombre rond juste au-dessus du maximum. */
function niceMax(max: number): number {
  if (max <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / (step / 2)) * (step / 2);
}

/**
 * Visites par jour sur la période choisie (7, 30 ou 90 jours), une barre par
 * jour : la fenêtre glisse et se termine toujours aujourd'hui.
 */
export function VisitsChart({ byDay, days }: { byDay: DayVisits[]; days: number }) {
  const series = dailySeries(byDay, days, todayUtc());
  const top = niceMax(Math.max(...series.map((d) => d.visits)));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / series.length;
  const barW = Math.max(2, slot * 0.7);
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;
  const ticks = [0, top / 2, top];
  // Dates repères sous l'axe : début, quarts et aujourd'hui.
  const marks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (series.length - 1)));

  return (
    <figure className="visits-chart">
      <figcaption>Visites par jour — {days} derniers jours</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Visites par jour sur les ${days} derniers jours`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="grid" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="axis">
              {t}
            </text>
          </g>
        ))}
        {series.map((d, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2;
          const h = d.visits > 0 ? Math.max(2, (d.visits / top) * innerH) : 0;
          return (
            <g key={d.day} className="bar">
              {/* Zone de survol sur toute la hauteur, pour lire aussi les jours à zéro. */}
              <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={innerH} className="hit" />
              {h > 0 && <rect x={x} y={PAD.top + innerH - h} width={barW} height={h} rx={1.5} className="value" />}
              <title>{`${shortDate(d.day)} : ${d.visits} visite${d.visits > 1 ? "s" : ""}`}</title>
            </g>
          );
        })}
        {marks.map((i, n) => (
          <text
            key={i}
            x={PAD.left + i * slot + slot / 2}
            y={H - 8}
            textAnchor={n === 0 ? "start" : n === marks.length - 1 ? "end" : "middle"}
            className="axis"
          >
            {n === marks.length - 1 ? "aujourd'hui" : shortDate(series[i].day)}
          </text>
        ))}
      </svg>
    </figure>
  );
}
