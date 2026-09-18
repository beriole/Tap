/**
 * Type reel d une image, lu dans ses premiers octets (phase 10, revue des
 * televersements). Le type annonce par le navigateur (`File.type`) vient du
 * client : un fichier HTML renomme en .png l annonce "image/png". Les en-tetes
 * nosniff empechent son execution, mais on ne stocke pas ce qu on n a pas
 * reconnu.
 *
 * Pur, sans dependance : teste par image-type.test.ts.
 */
export type ImageType = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

const ascii = (bytes: Uint8Array, from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));

export function sniffImageType(bytes: Uint8Array): ImageType | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (ascii(bytes, 0, 8) === "\x89PNG\r\n\x1a\n") return "image/png";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "image/webp";
  // ISO-BMFF : taille de boite, "ftyp", puis la marque majeure.
  if (ascii(bytes, 4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(bytes, 8, 12))) return "image/avif";
  return null;
}
