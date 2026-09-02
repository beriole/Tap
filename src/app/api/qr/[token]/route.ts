import { NextResponse } from "next/server";
import { cardQrSvg } from "@/lib/qr";
import { isValidCardToken } from "@/lib/tokens";

/**
 * §11 - Le QR Code pointe exactement vers la meme URL canonique que la NFC.
 * Le SVG est genere depuis le token seul : il ne divulgue aucune donnee de profil,
 * il peut donc etre mis en cache longuement.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!isValidCardToken(token)) {
    return NextResponse.json({ error: "Token invalide" }, { status: 400 });
  }

  const accent = new URL(request.url).searchParams.get("accent") ?? "#000000";
  const safeAccent = /^#[0-9A-Fa-f]{6}$/.test(accent) ? accent : "#000000";
  const svg = await cardQrSvg(token.toUpperCase(), safeAccent);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
