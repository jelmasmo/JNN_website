import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "./helpers/testDb";
import { runWithDb } from "~/server/runtime";
import { recordVisit, visitReport, type VisitInput } from "~/server/visits";

const NOW = "2026-10-02 12:00:00";

function visit(overrides: Partial<VisitInput> = {}): VisitInput {
  return {
    eventType: "home_view",
    vehicleId: null,
    path: "/",
    referrer: "https://www.google.be/",
    src: null,
    isEntry: true,
    siteHost: "jnn-drogenbos.be",
    country: "BE",
    city: "Uccle",
    region: "Bruxelles",
    at: "2026-10-01 09:00:00",
    ...overrides,
  };
}

describe("rapport de provenance des visiteurs", () => {
  let db: D1Database;
  beforeEach(() => {
    db = createTestDb();
  });

  it("compte les visites par provenance, de la plus fréquente à la moins fréquente", async () => {
    await runWithDb(db, recordVisit(visit()));
    await runWithDb(db, recordVisit(visit()));
    await runWithDb(db, recordVisit(visit({ referrer: "https://www.autoscout24.be/fr/" })));
    const report = await runWithDb(db, visitReport(30, NOW));
    expect(report.bySource).toEqual([
      { source: "google", visits: 2, contacts: 0 },
      { source: "autoscout24", visits: 1, contacts: 0 },
    ]);
    expect(report.totals.visits).toBe(3);
  });

  it("ne compte qu'une visite par visiteur, même s'il regarde plusieurs pages", async () => {
    await runWithDb(db, recordVisit(visit()));
    await runWithDb(db, recordVisit(visit({ eventType: "vehicle_view", vehicleId: "A1-21", path: "/vehicules/A1-21", isEntry: false })));
    const report = await runWithDb(db, visitReport(30, NOW));
    expect(report.totals.visits).toBe(1);
    expect(report.totals.vehicleViews).toBe(1);
  });

  it("attribue un contact WhatsApp ou e-mail à la provenance du visiteur", async () => {
    await runWithDb(db, recordVisit(visit({ src: "facebook", referrer: "" })));
    await runWithDb(db, recordVisit(visit({ eventType: "contact_whatsapp", vehicleId: "A1-21", src: "facebook", referrer: "", isEntry: false })));
    const report = await runWithDb(db, visitReport(30, NOW));
    expect(report.bySource).toEqual([{ source: "facebook", visits: 1, contacts: 1 }]);
    expect(report.totals.contacts).toBe(1);
  });

  it("classe les véhicules par intérêt : vues puis contacts sur la période", async () => {
    await runWithDb(db, recordVisit(visit({ eventType: "vehicle_view", vehicleId: "A1-21" })));
    await runWithDb(db, recordVisit(visit({ eventType: "vehicle_view", vehicleId: "GOLF-18" })));
    await runWithDb(db, recordVisit(visit({ eventType: "vehicle_view", vehicleId: "GOLF-18", isEntry: false })));
    await runWithDb(db, recordVisit(visit({ eventType: "contact_email", vehicleId: "GOLF-18", isEntry: false })));
    const report = await runWithDb(db, visitReport(30, NOW));
    expect(report.byVehicle).toEqual([
      { vehicle_id: "GOLF-18", views: 2, contacts: 1 },
      { vehicle_id: "A1-21", views: 1, contacts: 0 },
    ]);
  });

  it("ignore ce qui est plus ancien que la période demandée", async () => {
    await runWithDb(db, recordVisit(visit({ at: "2026-08-01 10:00:00" })));
    await runWithDb(db, recordVisit(visit({ at: "2026-09-30 10:00:00" })));
    expect((await runWithDb(db, visitReport(7, NOW))).totals.visits).toBe(1);
    expect((await runWithDb(db, visitReport(90, NOW))).totals.visits).toBe(2);
  });

  it("donne le nombre de visites par jour", async () => {
    await runWithDb(db, recordVisit(visit({ at: "2026-09-30 08:00:00" })));
    await runWithDb(db, recordVisit(visit({ at: "2026-10-01 09:00:00" })));
    await runWithDb(db, recordVisit(visit({ at: "2026-10-01 18:00:00" })));
    const report = await runWithDb(db, visitReport(30, NOW));
    expect(report.byDay).toEqual([
      { day: "2026-09-30", visits: 1 },
      { day: "2026-10-01", visits: 2 },
    ]);
  });

  it("indique de quelles villes viennent les visiteurs", async () => {
    await runWithDb(db, recordVisit(visit({ city: "Uccle" })));
    await runWithDb(db, recordVisit(visit({ city: "Uccle" })));
    await runWithDb(db, recordVisit(visit({ city: "Lille", country: "FR" })));
    const report = await runWithDb(db, visitReport(30, NOW));
    expect(report.byPlace).toEqual([
      { country: "BE", city: "Uccle", visits: 2 },
      { country: "FR", city: "Lille", visits: 1 },
    ]);
  });

  it("refuse un type d'événement inconnu sans rien enregistrer", async () => {
    await runWithDb(db, recordVisit(visit({ eventType: "n'importe quoi" as never })));
    expect((await runWithDb(db, visitReport(30, NOW))).totals.visits).toBe(0);
  });
});
