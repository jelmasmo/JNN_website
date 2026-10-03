import { describe, it, expect } from "vitest";
import { dailySeries } from "~/lib/dailySeries";

describe("visites par jour pour le graphique", () => {
  it("couvre chaque jour de la période et se termine aujourd'hui", () => {
    const series = dailySeries([], 30, "2026-10-02");
    expect(series).toHaveLength(30);
    expect(series[0].day).toBe("2026-09-03");
    expect(series.at(-1)!.day).toBe("2026-10-02");
  });

  it("met zéro les jours sans visite", () => {
    const series = dailySeries([{ day: "2026-10-01", visits: 4 }], 7, "2026-10-02");
    expect(series.map((d) => d.visits)).toEqual([0, 0, 0, 0, 0, 4, 0]);
  });

  it("passe correctement d'un mois à l'autre", () => {
    const series = dailySeries([], 3, "2026-03-01");
    expect(series.map((d) => d.day)).toEqual(["2026-02-27", "2026-02-28", "2026-03-01"]);
  });

  it("ignore les jours hors de la période", () => {
    const series = dailySeries([{ day: "2026-08-01", visits: 9 }], 7, "2026-10-02");
    expect(series.every((d) => d.visits === 0)).toBe(true);
  });
});
