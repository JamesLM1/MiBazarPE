import sharp from "sharp";

export const MAX_PHOTO_BYTES = 750 * 1024;
export async function normalizeProductPhoto(file: File): Promise<Buffer> {
  if (!file.size || file.size > MAX_PHOTO_BYTES) throw new Error("La foto debe pesar como máximo 750 KB.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Usa una imagen JPG, PNG o WebP.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const detected = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ? "image/jpeg"
    : bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "image/png"
    : bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP" ? "image/webp" : null;
  if (detected !== file.type) throw new Error("El contenido no coincide con una imagen JPG, PNG o WebP válida.");
  try {
    const photo = sharp(bytes, { limitInputPixels: 16000000, failOn: "warning" });
    const metadata = await photo.metadata();
    if ((metadata.pages ?? 1) > 1) throw new Error("animated");
    // Re-encoding removes metadata and embedded payloads; no external URLs are fetched.
    const result = await photo.rotate().resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    if (result.length > MAX_PHOTO_BYTES) throw new Error("size");
    return result;
  } catch { throw new Error("No pudimos procesar la imagen. Usa una foto estática válida de hasta 16 megapíxeles."); }
}
