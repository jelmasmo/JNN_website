import { Effect } from "effect";
import { query, run } from "./db";

export interface SoldPhoto {
  id: number;
  url: string;
  position: number;
}

/** Envoie une photo vers R2 et renvoie son URL publique. */
export async function uploadPhotoToR2(
  bucket: R2Bucket,
  publicBaseUrl: string,
  file: File,
  keyPrefix: string
): Promise<string> {
  const dot = file.name.lastIndexOf(".");
  const rawExt = dot > 0 ? file.name.slice(dot + 1) : "";
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const key = `${keyPrefix}/${crypto.randomUUID()}.${ext}`;
  const buf = await file.arrayBuffer();
  await bucket.put(key, buf, {
    httpMetadata: { contentType: file.type || "image/jpeg" },
  });
  return `${publicBaseUrl.replace(/\/$/, "")}/${key}`;
}

export function listSoldPhotos() {
  return Effect.gen(function* () {
    return yield* query<SoldPhoto>("SELECT * FROM sold_photos ORDER BY position ASC");
  });
}

export function addSoldPhoto(url: string, position: number) {
  return Effect.gen(function* () {
    yield* run("INSERT INTO sold_photos (url, position) VALUES (?, ?)", [url, position]);
  });
}

export function removeSoldPhoto(id: number) {
  return Effect.gen(function* () {
    yield* run("DELETE FROM sold_photos WHERE id = ?", [id]);
  });
}
