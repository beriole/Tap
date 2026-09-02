import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { after } from "next/server";
import { ThemeRenderer } from "@/components/themes/theme-renderer";
import { resolveCard } from "@/server/card-resolution";
import { recordScan } from "@/lib/analytics";

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ src?: string }> };

/** §13 - "Metadonnees Open Graph par profil ; indexation configurable." */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const result = await resolveCard(token);

  if (!result.ok) {
    return { title: "Carte indisponible", robots: { index: false, follow: false } };
  }

  const { identity, canonicalUrl } = result.profile;
  const title = [identity.displayName, identity.title].filter(Boolean).join(" - ");
  const description =
    identity.tagline ?? identity.bio?.slice(0, 160) ?? `Profil professionnel de ${identity.displayName}.`;

  return {
    title,
    description,
    // §13 - indexation configurable profil par profil.
    robots: result.profile.seoIndexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "profile",
      title,
      description,
      url: canonicalUrl,
      images: identity.avatarUrl ? [{ url: identity.avatarUrl }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CardProfilePage({ params, searchParams }: Props) {
  const { token } = await params;
  const { src } = await searchParams;
  const result = await resolveCard(token);

  if (!result.ok) {
    // §11 - une carte suspendue affiche une page neutre et ne revele rien.
    if (result.reason === "NOT_FOUND") notFound();
    redirect(`/card-unavailable?reason=${result.reason.toLowerCase()}`);
  }

  // §15 - le scan est enregistre apres la reponse : il ne retarde pas l affichage.
  const headerList = await headers();
  const userAgent = headerList.get("user-agent");
  const referrer = headerList.get("referer");
  after(async () => {
    await recordScan({
      cardId: result.cardId,
      userAgent,
      referrer,
      source: src === "qr" ? "QR" : src === "link" ? "LINK" : "NFC",
    });
  });

  return <ThemeRenderer profile={result.profile} />;
}
