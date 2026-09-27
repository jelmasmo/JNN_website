// Les photos iPhone arrivent souvent en HEIC : Safari sait les afficher,
// mais pas Chrome ni Firefox. On les convertit donc en JPEG avant l'envoi.

type HeicConverter = (file: File) => Promise<Blob>;

function isHeic(file: File): boolean {
  // Chrome ne renseigne pas toujours le type MIME d'un .heic : on regarde aussi l'extension.
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

function jpegName(name: string): string {
  return name.replace(/\.[^.]+$/, "") + ".jpg";
}

/** Décodage natif si le navigateur en est capable (Safari), sinon heic2any (Chrome, Firefox). */
const browserHeicToJpeg: HeicConverter = async (file) => {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (blob) return blob;
  } catch {
    // Décodage natif indisponible : on passe à heic2any.
  }
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  return Array.isArray(out) ? out[0] : out;
};

/** Renvoie un fichier affichable par tous les navigateurs. */
export async function toWebCompatible(file: File, convert: HeicConverter = browserHeicToJpeg): Promise<File> {
  if (!isHeic(file)) return file;
  let blob: Blob;
  try {
    blob = await convert(file);
  } catch {
    throw new Error(`Impossible de convertir la photo « ${file.name} » (format HEIC).`);
  }
  return new File([blob], jpegName(file.name), { type: "image/jpeg" });
}
