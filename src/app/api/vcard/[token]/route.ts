import { NextResponse } from "next/server";
import { resolvePublicToken } from "@/server/share-links";
import { buildVCard, vcardFileName } from "@/lib/vcard";
import { recordClick } from "@/lib/analytics";

/**
 * §5.5 - "Le serveur genere une vCard a partir des informations actuelles du
 * profil." Le jeton peut etre celui d une carte ou d un lien de partage : dans
 * ce second cas, la vCard ne contient que ce que le lien expose - enregistrer
 * le contact ne contourne jamais le masque.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = await resolvePublicToken(token);

  if (!result) {
    return NextResponse.json({ error: "Carte indisponible" }, { status: 404 });
  }

  const vcf = buildVCard(result.profile);
  await recordClick({ profileId: result.profile.id, action: "VCARD" });

  return new NextResponse(vcf, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${vcardFileName(result.profile)}"`,
      "Cache-Control": "no-store",
    },
  });
}
