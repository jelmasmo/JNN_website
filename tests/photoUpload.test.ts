import { describe, it, expect } from "vitest";
import { uploadPhotoToR2 } from "~/server/photos";

/** Faux bucket R2 (service externe) : garde en mémoire ce qui y est déposé. */
function fakeBucket() {
  const objects = new Map<string, { body: ArrayBuffer; contentType?: string }>();
  const bucket = {
    async put(key: string, body: ArrayBuffer, opts?: { httpMetadata?: { contentType?: string } }) {
      objects.set(key, { body, contentType: opts?.httpMetadata?.contentType });
    },
  };
  return { bucket: bucket as unknown as R2Bucket, objects };
}

const BASE = "https://pub-123.r2.dev";

function keyOf(url: string) {
  return url.slice(BASE.length + 1);
}

describe("envoi d'une photo vers R2", () => {
  it("la photo est accessible à l'URL publique renvoyée, dans le dossier demandé", async () => {
    const { bucket, objects } = fakeBucket();
    const url = await uploadPhotoToR2(bucket, BASE, new File(["img"], "golf.JPG", { type: "image/jpeg" }), "vehicles");
    expect(url).toMatch(/^https:\/\/pub-123\.r2\.dev\/vehicles\/[0-9a-f-]+\.jpg$/);
    expect(objects.get(keyOf(url))?.contentType).toBe("image/jpeg");
  });

  it("deux envois du même fichier ne s'écrasent pas", async () => {
    const { bucket } = fakeBucket();
    const file = new File(["img"], "a.png", { type: "image/png" });
    const url1 = await uploadPhotoToR2(bucket, BASE, file, "sold");
    const url2 = await uploadPhotoToR2(bucket, BASE, file, "sold");
    expect(url1).not.toBe(url2);
  });

  it("tolère une URL publique configurée avec une barre oblique finale", async () => {
    const { bucket } = fakeBucket();
    const url = await uploadPhotoToR2(bucket, `${BASE}/`, new File(["img"], "a.png"), "sold");
    expect(url.startsWith(`${BASE}/sold/`)).toBe(true);
  });

  it("un fichier sans extension est enregistré en .jpg", async () => {
    const { bucket } = fakeBucket();
    const url = await uploadPhotoToR2(bucket, BASE, new File(["img"], "IMG_1234"), "vehicles");
    expect(url).toMatch(/\.jpg$/);
  });
});
