import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

/**
 * Stockage des medias (§8 "Stockage images").
 *
 * Deux pilotes derriere une seule interface :
 *  - `cloudinary` : des que CLOUDINARY_CLOUD_NAME est defini. Redimensionnement,
 *    negociation de format et CDN sont delegues a Cloudinary.
 *  - `local` : repli sur disque, dans UPLOAD_DIR. Utile en developpement et sur
 *    un serveur a volume persistant ; inutilisable sur un hebergement dont le
 *    systeme de fichiers est ephemere.
 *
 * Le repertoire local est deliberement hors de public/ : un fichier depose la
 * serait accessible a quiconque devine son nom, sans controle d acces.
 */

export type StoredObject = { key: string; url: string; contentType: string; size: number };

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const CLOUD_FOLDER = "tap/profils";

function uploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");
}

export function storageDriver(): "cloudinary" | "local" {
  return process.env.CLOUDINARY_CLOUD_NAME ? "cloudinary" : "local";
}

/** Cle opaque : rien du nom d origine ne subsiste, aucune enumeration possible. */
function makeKey(ownerId: string): string {
  const owner = createHash("sha256").update(ownerId).digest("hex").slice(0, 12);
  return `${owner}-${randomBytes(12).toString("hex")}`;
}

// ---------------------------------------------------------------------------
// Cloudinary
// ---------------------------------------------------------------------------

/**
 * Signature d appel Cloudinary : SHA-1 des parametres tries, concatenes, suivis
 * du secret. On signe cote serveur plutot que d ouvrir un preset non signe :
 * sinon n importe qui pourrait televerser dans le compte.
 */
function signParams(params: Record<string, string>, secret: string): string {
  const canonical = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(canonical + secret).digest("hex");
}

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "CLOUDINARY_CLOUD_NAME est defini mais CLOUDINARY_API_KEY ou CLOUDINARY_API_SECRET manque.",
    );
  }
  return { cloudName, apiKey, apiSecret };
}

async function putCloudinary(input: { ownerId: string; file: File }): Promise<StoredObject> {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const publicId = `${CLOUD_FOLDER}/${makeKey(input.ownerId)}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Transformation appliquee A L ENREGISTREMENT : l original n est jamais
  // servi. On plafonne a 1600 px de large et on laisse Cloudinary choisir le
  // format (AVIF, WebP) et la compression selon le navigateur (§13).
  const transformation = "c_limit,w_1600,q_auto,f_auto";

  const signed: Record<string, string> = {
    public_id: publicId,
    timestamp,
    transformation,
    overwrite: "true",
    invalidate: "true",
  };

  const form = new FormData();
  form.append("file", input.file);
  form.append("api_key", apiKey);
  for (const [k, v] of Object.entries(signed)) form.append(k, v);
  form.append("signature", signParams(signed, apiSecret));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  const body = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
    bytes?: number;
    format?: string;
    error?: { message?: string };
  };

  if (!response.ok || !body.secure_url) {
    throw new Error(body.error?.message ?? `Cloudinary a refuse l envoi (HTTP ${response.status})`);
  }

  return {
    key: body.public_id ?? publicId,
    url: body.secure_url,
    contentType: body.format ? `image/${body.format}` : input.file.type,
    size: body.bytes ?? input.file.size,
  };
}

/**
 * Retrouve l identifiant Cloudinary depuis une URL de livraison.
 * Format : https://res.cloudinary.com/<cloud>/image/upload/<transfos>/v<n>/<public_id>.<ext>
 */
export function cloudinaryPublicId(url: string): string | null {
  const match = url.match(/res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:.+?\/)?v\d+\/(.+)\.\w+$/);
  return match?.[1] ?? null;
}

/**
 * Supprime un media devenu inutile.
 *
 * Sans cela, chaque changement de photo laisserait l ancienne sur le compte :
 * une bibliotheque qui grossit indefiniment, et des portraits de clients qui
 * survivent a leur remplacement.
 */
export async function deleteObject(url: string): Promise<void> {
  if (!url) return;

  if (url.includes("res.cloudinary.com")) {
    const publicId = cloudinaryPublicId(url);
    if (!publicId) return;

    try {
      const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signed = { public_id: publicId, timestamp, invalidate: "true" };

      const form = new FormData();
      form.append("api_key", apiKey);
      for (const [k, v] of Object.entries(signed)) form.append(k, v);
      form.append("signature", signParams(signed, apiSecret));

      await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: "POST",
        body: form,
      });
    } catch {
      // Un menage rate ne doit jamais faire echouer un televersement reussi.
    }
    return;
  }

  const localKey = url.match(/^\/api\/media\/([\w.-]+)$/)?.[1];
  if (!localKey) return;
  await unlink(path.join(uploadDir(), localKey)).catch(() => {});
}

// ---------------------------------------------------------------------------
// Interface commune
// ---------------------------------------------------------------------------

export async function putObject(input: { ownerId: string; file: File }): Promise<StoredObject> {
  if (storageDriver() === "cloudinary") return putCloudinary(input);

  const extension = EXTENSIONS[input.file.type] ?? "bin";
  const key = `${makeKey(input.ownerId)}.${extension}`;
  const dir = uploadDir();

  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await input.file.arrayBuffer());
  await writeFile(path.join(dir, key), bytes);

  return { key, url: `/api/media/${key}`, contentType: input.file.type, size: bytes.byteLength };
}

export async function getObject(key: string): Promise<{ body: Buffer; contentType: string } | null> {
  // La cle vient de l URL : on refuse tout ce qui n est pas exactement le
  // format genere, ce qui exclut d office les traversees de repertoire.
  if (!/^[a-f0-9]{12}-[a-f0-9]{24}\.(jpg|png|webp|avif)$/.test(key)) return null;

  try {
    const body = await readFile(path.join(uploadDir(), key));
    const ext = key.split(".").pop() ?? "";
    const contentType =
      Object.entries(EXTENSIONS).find(([, e]) => e === ext)?.[0] ?? "application/octet-stream";
    return { body, contentType };
  } catch {
    return null;
  }
}
