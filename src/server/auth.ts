import { Effect } from "effect";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { query, run } from "./db";

/**
 * Authentification admin.
 *
 * Les mots de passe sont hachés en scrypt côté serveur (voir
 * scripts/create-admin.mjs, format "scrypt$<salt>$<hash>", jamais en
 * clair). Une fois connecté, le client reçoit un jeton signé (HMAC-SHA256,
 * via Web Crypto — disponible nativement dans le Worker, pas besoin de
 * cookies) qu'il renvoie à chaque action admin ; le serveur vérifie la
 * signature avant d'agir. C'est volontairement plus simple qu'une vraie
 * gestion de session par cookie, largement suffisant pour un seul compte
 * admin.
 */

export interface AdminUser {
  username: string;
  password_hash: string;
}

function verifyScrypt(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expectedHex] = parts;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12h

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Buffer.from(sig).toString("hex");
}

export async function issueToken(secret: string, username: string): Promise<string> {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${username}.${exp}`;
  const sig = await hmac(secret, payload);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export async function verifyToken(secret: string, token: string | null | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [username, expStr, sig] = decoded.split(".");
    if (!username || !expStr || !sig) return null;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Date.now() > exp) return null;
    const expectedSig = await hmac(secret, `${username}.${expStr}`);
    if (expectedSig.length !== sig.length) return null;
    const a = new TextEncoder().encode(expectedSig);
    const b = new TextEncoder().encode(sig);
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return username;
  } catch {
    return null;
  }
}

/** Vérifie les identifiants contre `admin_users`. Renvoie l'utilisateur ou null. */
export function checkCredentials(username: string, password: string) {
  return Effect.gen(function* () {
    const rows = yield* query<AdminUser>(
      "SELECT username, password_hash FROM admin_users WHERE username = ?",
      [username]
    );
    const user = rows[0];
    if (!user) return null;
    return verifyScrypt(password, user.password_hash) ? user.username : null;
  });
}

/** Change le mot de passe admin (appelant déjà authentifié — vérifié côté handler). */
export function setPassword(username: string, newPasswordHash: string) {
  return Effect.gen(function* () {
    yield* run("DELETE FROM admin_users WHERE username != ?", [username]);
    const exists = yield* query<AdminUser>("SELECT username FROM admin_users WHERE username = ?", [username]);
    if (exists.length) {
      yield* run("UPDATE admin_users SET password_hash = ? WHERE username = ?", [newPasswordHash, username]);
    } else {
      yield* run("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)", [username, newPasswordHash]);
    }
  });
}

export function hashPassword(password: string): string {
  const salt = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}
