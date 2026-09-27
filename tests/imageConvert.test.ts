import { describe, it, expect } from "vitest";
import { toWebCompatible } from "~/lib/imageConvert";

// Simule le décodeur HEIC du navigateur (absent sous Node).
const fakeConvert = async () => new Blob(["jpeg-bytes"], { type: "image/jpeg" });

describe("toWebCompatible", () => {
  it("laisse passer tel quel un JPEG", async () => {
    const file = new File(["abc"], "photo.jpg", { type: "image/jpeg" });
    expect(await toWebCompatible(file, fakeConvert)).toBe(file);
  });

  it("convertit une photo HEIC en fichier JPEG", async () => {
    const file = new File(["heic-bytes"], "IMG_1234.HEIC", { type: "image/heic" });
    const out = await toWebCompatible(file, fakeConvert);
    expect(out.type).toBe("image/jpeg");
    expect(out.name).toBe("IMG_1234.jpg");
    expect(await out.text()).toBe("jpeg-bytes");
  });

  it("reconnaît un HEIC à son extension quand le navigateur ne fournit pas de type", async () => {
    const file = new File(["heic-bytes"], "voiture.heif", { type: "" });
    const out = await toWebCompatible(file, fakeConvert);
    expect(out.name).toBe("voiture.jpg");
  });

  it("signale clairement une photo HEIC impossible à convertir", async () => {
    const file = new File(["corrompu"], "IMG_9.heic", { type: "image/heic" });
    const failing = () => Promise.reject({ code: 2, message: "ERR_LIBHEIF" });
    await expect(toWebCompatible(file, failing)).rejects.toThrow(
      "Impossible de convertir la photo « IMG_9.heic » (format HEIC)."
    );
  });
});
