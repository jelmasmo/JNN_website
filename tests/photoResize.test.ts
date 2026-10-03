import { describe, it, expect } from "vitest";
import { targetSize, optimizeForWeb, MAX_PHOTO_SIDE } from "~/lib/imageConvert";

// Simulent le décodeur HEIC et le redimensionnement du navigateur (absents sous Node).
const fakeConvert = async () => new Blob(["jpeg-bytes"], { type: "image/jpeg" });
const bytes = (n: number) => new Uint8Array(n);
const shrinkTo = (size: number) => async () => new Blob([bytes(size)], { type: "image/jpeg" });

describe("taille cible d'une photo", () => {
  it("ramène une photo de téléphone en paysage à 1600 pixels de large, sans la déformer", () => {
    expect(targetSize(4032, 3024)).toEqual({ width: 1600, height: 1200 });
  });

  it("ramène une photo en portrait à 1600 pixels de haut", () => {
    expect(targetSize(3024, 4032)).toEqual({ width: 1200, height: 1600 });
  });

  it("n'agrandit jamais une petite photo", () => {
    expect(targetSize(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("limite le plus grand côté à 1600 pixels", () => {
    expect(MAX_PHOTO_SIDE).toBe(1600);
  });
});

describe("préparation d'une photo avant envoi", () => {
  it("allège une photo lourde en JPEG plus léger", async () => {
    const big = new File([bytes(3_000_000)], "IMG_0001.jpg", { type: "image/jpeg" });
    const out = await optimizeForWeb(big, { convert: fakeConvert, shrink: shrinkTo(250_000) });
    expect(out.size).toBe(250_000);
    expect(out.type).toBe("image/jpeg");
    expect(out.name).toBe("IMG_0001.jpg");
  });

  it("donne l'extension .jpg à une photo réencodée (ex. PNG)", async () => {
    const png = new File([bytes(2_000_000)], "capture.png", { type: "image/png" });
    const out = await optimizeForWeb(png, { convert: fakeConvert, shrink: shrinkTo(200_000) });
    expect(out.name).toBe("capture.jpg");
  });

  it("laisse telle quelle une photo déjà légère", async () => {
    const light = new File([bytes(150_000)], "petite.jpg", { type: "image/jpeg" });
    const out = await optimizeForWeb(light, { convert: fakeConvert, shrink: shrinkTo(10) });
    expect(out).toBe(light);
  });

  it("garde l'original si la version réduite n'est pas plus légère", async () => {
    const file = new File([bytes(500_000)], "deja-optimisee.jpg", { type: "image/jpeg" });
    const out = await optimizeForWeb(file, { convert: fakeConvert, shrink: shrinkTo(600_000) });
    expect(out).toBe(file);
  });

  it("envoie quand même la photo si la réduction échoue", async () => {
    const file = new File([bytes(2_000_000)], "photo.jpg", { type: "image/jpeg" });
    const out = await optimizeForWeb(file, { convert: fakeConvert, shrink: () => Promise.reject(new Error("canvas")) });
    expect(out).toBe(file);
  });

  it("convertit d'abord une photo iPhone (HEIC) puis la réduit", async () => {
    const heic = new File([bytes(2_500_000)], "IMG_5.HEIC", { type: "image/heic" });
    const convert = async () => new Blob([bytes(4_000_000)], { type: "image/jpeg" });
    const out = await optimizeForWeb(heic, { convert, shrink: shrinkTo(300_000) });
    expect(out.name).toBe("IMG_5.jpg");
    expect(out.size).toBe(300_000);
  });
});
