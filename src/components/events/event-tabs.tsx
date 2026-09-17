"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Onglets d un evenement, poses dans la bande de titre.
 *
 * On ne montre que les onglets autorises : un co-organisateur charge de
 * l accueil n a pas a voir une porte "Contenu" qui lui repondrait 404.
 * (Le serveur refuse de toute facon - ceci n est que de la politesse.)
 */
export function EventTabs({ eventId, allowed }: { eventId: string; allowed: { content: boolean; guests: boolean; design: boolean; share: boolean } }) {
  const pathname = usePathname();
  const base = `/dashboard/events/${eventId}`;
  const tabs = [
    { href: base, label: "Vue d ensemble", show: true, exact: true },
    { href: `${base}/invites`, label: "Invites", show: allowed.guests },
    { href: `${base}/partage`, label: "Partage", show: allowed.share },
    { href: `${base}/contenu`, label: "Contenu", show: allowed.content },
    { href: `${base}/rsvp`, label: "Reponses", show: allowed.design },
    { href: `${base}/design`, label: "Design", show: allowed.design },
  ].filter((t) => t.show);

  return (
    <nav aria-label="Sections de l evenement" className="-mx-4 mt-7 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1 rounded-xl bg-[var(--console-band-soft)] p-1">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-lg px-4 py-2 text-[0.84rem] transition-colors",
                  active
                    ? "bg-[var(--console-on-band)] font-semibold text-[var(--brand-ink)]"
                    : "text-[var(--console-on-band-dim)] hover:text-[var(--console-on-band)]",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
