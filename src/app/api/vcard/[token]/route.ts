import { NextResponse } from "next/server";
import { resolveCard } from "@/server/card-resolution";
import { buildVCard, vcardFileName } from "@/lib/vcard";
import { recordClick } from "@/lib/analytics";

/**
 * §5.5 - "Le serveur genere une vCard a partir des informations actuelles du
 * profil." Aucun cache : le contact telecharge reflete toujours l etat publie.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = await resolveCard(token);

  if (!result.ok) {
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
