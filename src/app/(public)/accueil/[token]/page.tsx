import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isTicketCode } from "@/lib/events/checkin";
import { Station } from "@/components/checkin/station";

export const metadata: Metadata = { title: "Poste d’accueil", robots: { index: false, follow: false }, referrer: "no-referrer" };

/**
 * Poste d accueil sans compte (D6). Le jeton du lien identifie le poste ; le
 * PIN, demande a l ouverture, prouve qu on est bien la personne a qui
 * l organisateur l a remis. Rien de l evenement n est rendu tant que le PIN
 * n a pas ete verifie par l API.
 */
export default async function StationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isTicketCode(token)) notFound();
  const station = await prisma.checkInStation.findUnique({ where: { token }, select: { revokedAt: true } });
  if (!station || station.revokedAt) notFound();

  return (
    <main className="min-h-dvh bg-[#FAF8F4] text-[#1D1916] antialiased">
      <Station token={token} />
    </main>
  );
}
