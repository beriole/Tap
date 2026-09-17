import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isTicketCode, ticketUrl, ticketVerdict } from "@/lib/events/checkin";
import { dateParts } from "@/lib/events/invitation-view";
import { displayName } from "@/lib/events/names";

export const metadata: Metadata = { title: "Votre accès", robots: { index: false, follow: false }, referrer: "no-referrer" };

/**
 * QR d acces d un groupe (cahier §10, D2).
 *
 * Le QR ne contient que l URL de cette page - un code opaque, aucune donnee
 * personnelle. Un lecteur generique ouvre cette page ; le poste d accueil,
 * lui, en extrait le code.
 *
 * Page volontairement nue : fond clair, QR en grand, luminosite au maximum
 * conseillee - c est un ecran qu on tend a l entree, souvent dehors, le soir.
 */
export default async function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!isTicketCode(code)) notFound();
  const limit = await rateLimit(`ticket-page:${clientIp(await headers())}`, 60, 60_000);
  if (!limit.allowed) notFound();

  const ticket = await prisma.ticket.findUnique({
    where: { code },
    select: {
      seats: true,
      seatsUsed: true,
      cancelledAt: true,
      invitation: {
        select: {
          revokedAt: true,
          group: {
            select: {
              name: true,
              guests: { where: { attending: true }, orderBy: { position: "asc" }, select: { firstName: true, lastName: true } },
              event: { select: { status: true, title: true, hosts: true, startsAt: true, timezone: true, venues: { orderBy: { position: "asc" }, take: 1, select: { name: true, address: true } } } },
            },
          },
        },
      },
    },
  });
  if (!ticket || ticket.invitation.revokedAt) notFound();
  const { group } = ticket.invitation;
  const { event } = group;
  if (event.status !== "PUBLISHED" && event.status !== "CLOSED") notFound();

  const verdict = ticketVerdict({ seats: ticket.seats, seatsUsed: ticket.seatsUsed, cancelledAt: ticket.cancelledAt, eventStatus: event.status });
  // Sans attribut width : le SVG prend la largeur de son cadre (viewBox seul).
  // Avec width=640, il debordait a droite sur un ecran de 390 px.
  const svg = (await QRCode.toString(ticketUrl(siteConfig.url, code), { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: "#1D1916", light: "#FFFFFF" } })).replace(/<svg /, '<svg class="block h-auto w-full" ');
  const starts = dateParts(event.startsAt, event.timezone);
  const venue = event.venues[0];

  return (
    <main className="flex min-h-dvh flex-col items-center bg-white px-6 py-8 text-center text-[#1D1916] antialiased">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#7A5D33]">Accès à l’événement</p>
      <h1 className="mt-3 text-[22px] font-medium leading-tight">{event.title}</h1>
      <p className="mt-1 text-[14px] text-[#675B52]">
        {starts.long} · {starts.time}
        {venue && <span className="block">{venue.name}</span>}
      </p>

      <div className="mt-7 w-full max-w-[320px]">
        {verdict.kind === "cancelled" ? (
          <div className="rounded-lg border border-[#E0D3BE] p-8 text-[15px] text-[#675B52]">Cette invitation a été annulée.</div>
        ) : (
          <div className="rounded-lg border border-[#E0D3BE] bg-white p-5" dangerouslySetInnerHTML={{ __html: svg }} />
        )}
      </div>

      <p className="mt-6 text-[20px] font-medium">{group.name}</p>
      <p className="mt-1 text-[15px] text-[#675B52]">
        {ticket.seats} place{ticket.seats > 1 ? "s" : ""} · {group.guests.map((g) => displayName(g, "Accompagnant")).join(", ")}
      </p>
      {verdict.kind === "used" && <p className="mt-4 rounded-full bg-[#F6F0E4] px-4 py-2 text-[13px] text-[#7A5D33]">Toutes les places ont été utilisées.</p>}
      {verdict.kind === "partial" && (
        <p className="mt-4 rounded-full bg-[#F6F0E4] px-4 py-2 text-[13px] text-[#7A5D33]">
          {verdict.remaining} place{verdict.remaining > 1 ? "s" : ""} restante{verdict.remaining > 1 ? "s" : ""}.
        </p>
      )}

      <p className="mt-auto max-w-[300px] pt-10 text-[13px] leading-relaxed text-[#675B52]">
        Présentez cet écran à l’entrée, luminosité au maximum. Faites une capture d’écran pour l’avoir sans réseau.
      </p>
    </main>
  );
}
