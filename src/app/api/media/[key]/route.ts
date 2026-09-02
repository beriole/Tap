import { NextResponse } from "next/server";
import { getObject } from "@/lib/storage";

/**
 * Sert un media stocke par le pilote local.
 *
 * Les images de profil sont publiques par nature (elles s affichent sur la page
 * publique), mais la cle est opaque et non enumerable : rien ne fuit d un
 * profil non publie tant que son URL n a pas ete rendue par le serveur.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const object = await getObject(key);

  if (!object) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(object.body), {
    headers: {
      "Content-Type": object.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
