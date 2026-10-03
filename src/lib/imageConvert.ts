// Préparation des photos avant l'envoi depuis l'admin :
// - les photos iPhone arrivent souvent en HEIC : Safari sait les afficher,
//   mais pas Chrome ni Firefox. On les convertit donc en JPEG ;
// - les photos de téléphone pèsent plusieurs Mo : on les réduit à 1600 px
//   de côté (JPEG ~ quelques centaines de Ko), pour des pages rapides et
//   des aperçus de liens qui s'affichent sur WhatsApp.

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

/** Plus grand côté (en pixels) d'une photo envoyée sur le site. */
export const MAX_PHOTO_SIDE = 1600;
/** En dessous de ce poids, une photo est déjà assez légère : on n'y touche pas. */
const LIGHT_ENOUGH_BYTES = 300_000;
const JPEG_QUALITY = 0.82;

/** Dimensions après réduction : plus grand côté limité à MAX_PHOTO_SIDE, proportions gardées, jamais agrandie. */
export function targetSize(width: number, height: number, maxSide = MAX_PHOTO_SIDE): { width: number; height: number } {
  const ratio = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

type Shrinker = (image: Blob) => Promise<Blob>;

/** Réduction dans le navigateur (canvas), en respectant l'orientation de la photo. */
const browserShrink: Shrinker = async (image) => {
  const bitmap = await createImageBitmap(image, { imageOrientation: "from-image" });
  const { width, height } = targetSize(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  if (!blob) throw new Error("Réduction de la photo impossible.");
  return blob;
};

/**
 * Photo prête à être envoyée : convertie en JPEG si besoin (HEIC), puis
 * réduite si elle est lourde. Si la réduction échoue ou n'allège pas la
 * photo, on envoie la version non réduite plutôt que de bloquer l'envoi.
 */
export async function optimizeForWeb(
  file: File,
  { convert = browserHeicToJpeg, shrink = browserShrink }: { convert?: HeicConverter; shrink?: Shrinker } = {}
): Promise<File> {
  const compatible = await toWebCompatible(file, convert);
  if (compatible.size <= LIGHT_ENOUGH_BYTES) return compatible;
  try {
    const smaller = await shrink(compatible);
    if (smaller.size >= compatible.size) return compatible;
    return new File([smaller], jpegName(compatible.name), { type: "image/jpeg" });
  } catch {
    return compatible;
  }
}
