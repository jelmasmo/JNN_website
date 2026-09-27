import { describe, it, expect } from "vitest";
import { moveImage, reorderImages } from "~/lib/imageOrder";

describe("ordre des photos d'un véhicule", () => {
  it("décaler une photo l'échange avec sa voisine", () => {
    expect(moveImage(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
  });

  it("une photo déjà en bout de liste ne bouge pas", () => {
    expect(moveImage(["a", "b"], 1, 1)).toEqual(["a", "b"]);
    expect(moveImage(["a", "b"], 0, -1)).toEqual(["a", "b"]);
  });

  it("glisser-déposer une photo l'insère à la position visée", () => {
    expect(reorderImages(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(reorderImages(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });
});
