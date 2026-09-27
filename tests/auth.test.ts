import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTestDb } from "./helpers/testDb";
import { runWithDb } from "~/server/runtime";
import { issueToken, verifyToken, hashPassword, setPassword, checkCredentials } from "~/server/auth";

const SECRET = "secret-de-test";

describe("jeton de session admin", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("un jeton émis est reconnu et identifie l'admin", async () => {
    const token = await issueToken(SECRET, "JNN1620");
    expect(await verifyToken(SECRET, token)).toBe("JNN1620");
  });

  it("un jeton signé avec une autre clé est refusé", async () => {
    const token = await issueToken("autre-secret", "JNN1620");
    expect(await verifyToken(SECRET, token)).toBeNull();
  });

  it("un jeton falsifié (identifiant modifié) est refusé", async () => {
    const token = await issueToken(SECRET, "JNN1620");
    const [, exp, sig] = Buffer.from(token, "base64url").toString("utf8").split(".");
    const forged = Buffer.from(`pirate.${exp}.${sig}`).toString("base64url");
    expect(await verifyToken(SECRET, forged)).toBeNull();
  });

  it("un jeton expire après 12 heures", async () => {
    vi.useFakeTimers();
    const token = await issueToken(SECRET, "JNN1620");
    vi.advanceTimersByTime(12 * 60 * 60 * 1000 + 1);
    expect(await verifyToken(SECRET, token)).toBeNull();
  });

  it("l'absence de jeton ou un jeton illisible est refusé", async () => {
    expect(await verifyToken(SECRET, null)).toBeNull();
    expect(await verifyToken(SECRET, "")).toBeNull();
    expect(await verifyToken(SECRET, "n-importe-quoi")).toBeNull();
  });

  it("un identifiant contenant un point reste connecté", async () => {
    const token = await issueToken(SECRET, "jean.dupont");
    expect(await verifyToken(SECRET, token)).toBe("jean.dupont");
  });
});

describe("identifiants admin", () => {
  let db: D1Database;
  beforeEach(async () => {
    db = createTestDb();
    await runWithDb(db, setPassword("JNN1620", hashPassword("bon-mot-de-passe")));
  });

  it("accepte le bon mot de passe", async () => {
    expect(await runWithDb(db, checkCredentials("JNN1620", "bon-mot-de-passe"))).toBe("JNN1620");
  });

  it("refuse un mauvais mot de passe", async () => {
    expect(await runWithDb(db, checkCredentials("JNN1620", "mauvais"))).toBeNull();
  });

  it("refuse un identifiant inconnu", async () => {
    expect(await runWithDb(db, checkCredentials("inconnu", "bon-mot-de-passe"))).toBeNull();
  });

  it("le mot de passe n'est jamais stocké en clair", () => {
    expect(hashPassword("bon-mot-de-passe")).not.toContain("bon-mot-de-passe");
  });

  it("changer le mot de passe invalide l'ancien", async () => {
    await runWithDb(db, setPassword("JNN1620", hashPassword("nouveau")));
    expect(await runWithDb(db, checkCredentials("JNN1620", "bon-mot-de-passe"))).toBeNull();
    expect(await runWithDb(db, checkCredentials("JNN1620", "nouveau"))).toBe("JNN1620");
  });

  it("changer d'identifiant remplace l'ancien compte (un seul admin)", async () => {
    await runWithDb(db, setPassword("edan", hashPassword("nouveau")));
    expect(await runWithDb(db, checkCredentials("edan", "nouveau"))).toBe("edan");
    expect(await runWithDb(db, checkCredentials("JNN1620", "bon-mot-de-passe"))).toBeNull();
  });
});
