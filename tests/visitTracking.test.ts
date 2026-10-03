import { describe, it, expect } from "vitest";
import { visitOrigin } from "~/lib/visitOrigin";

function fakeStorage(): Pick<Storage, "getItem" | "setItem"> {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

describe("origine d'une visite, mémorisée le temps de la visite", () => {
  it("retient à l'arrivée le site d'origine et l'étiquette du lien", () => {
    const storage = fakeStorage();
    expect(visitOrigin(storage, { referrer: "https://www.google.be/", search: "?src=whatsapp" })).toEqual({
      referrer: "https://www.google.be/",
      src: "whatsapp",
      isEntry: true,
    });
  });

  it("accepte aussi l'étiquette standard utm_source", () => {
    expect(visitOrigin(fakeStorage(), { referrer: "", search: "?utm_source=facebook&x=1" }).src).toBe("facebook");
  });

  it("garde la même origine pour les pages suivantes, sans les compter comme de nouvelles arrivées", () => {
    const storage = fakeStorage();
    visitOrigin(storage, { referrer: "https://www.autoscout24.be/", search: "" });
    expect(visitOrigin(storage, { referrer: "https://jnn-drogenbos.be/", search: "" })).toEqual({
      referrer: "https://www.autoscout24.be/",
      src: null,
      isEntry: false,
    });
  });

  it("fonctionne même si le navigateur bloque la mémoire de session", () => {
    const blocked = {
      getItem: () => {
        throw new Error("bloqué");
      },
      setItem: () => {
        throw new Error("bloqué");
      },
    };
    expect(visitOrigin(blocked, { referrer: "", search: "" })).toEqual({ referrer: "", src: null, isEntry: true });
  });
});
