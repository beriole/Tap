"use client";

import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { trackClick } from "./track";
import type { PublicProfile } from "@/types/profile";

type Layout = "table" | "stacked" | "boxed";

/**
 * Les coordonnees, presentees comme sur une carte de visite imprimee.
 *
 * Trois dispositions, parce que les references en montrent trois :
 *  - `table`   : etiquette a gauche, valeur alignee a droite (papier a en-tete) ;
 *  - `stacked` : etiquette en petit au-dessus de la valeur (fiche produit) ;
 *  - `boxed`   : chaque ligne dans son propre cadre, avec l icone en pastille.
 *
 * Dans tous les cas la ligne est cliquable : personne ne recopie un numero a la
 * main depuis un ecran.
 */
export function ContactRows({
  profile,
  layout = "table",
  tone = "light",
  preview,
  className,
}: {
  profile: PublicProfile;
  layout?: Layout;
  tone?: "light" | "dark";
  preview?: boolean;
  className?: string;
}) {
  const { contact, location, id } = profile;
  const address = [location.address, location.city, location.country].filter(Boolean).join(", ");

  const rows = [
    contact.phone && {
      key: "phone",
      label: "Telephone",
      value: contact.phone,
      href: `tel:${contact.phone}`,
      icon: <Phone className="size-4" />,
      action: "CALL" as const,
    },
    contact.email && {
      key: "email",
      label: "E-mail",
      value: contact.email,
      href: `mailto:${contact.email}`,
      icon: <Mail className="size-4" />,
      action: "EMAIL" as const,
    },
    contact.website && {
      key: "website",
      label: "Site web",
      value: contact.website.replace(/^https?:\/\//, ""),
      href: contact.website,
      icon: <Globe className="size-4" />,
      action: "LINK" as const,
    },
    address && {
      key: "address",
      label: "Adresse",
      value: address,
      href: location.mapUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      icon: <MapPin className="size-4" />,
      action: "DIRECTIONS" as const,
    },
  ].filter(Boolean) as {
    key: string;
    label: string;
    value: string;
    href: string;
    icon: React.ReactNode;
    action: "CALL" | "EMAIL" | "LINK" | "DIRECTIONS";
  }[];

  if (rows.length === 0) return null;

  const muted = tone === "dark" ? "text-white/40" : "text-[var(--muted)]";
  const strong = tone === "dark" ? "text-white/90" : "text-[var(--foreground)]";
  const rule = tone === "dark" ? "divide-white/10 border-white/10" : "divide-[var(--border)] border-[var(--border)]";

  return (
    <div
      className={cn(
        layout === "table" && cn("divide-y border-y", rule),
        layout === "stacked" && "flex flex-col gap-2",
        layout === "boxed" && "flex flex-col gap-2",
        className,
      )}
    >
      {rows.map((row) => {
        const external = row.href.startsWith("http");
        const content =
          layout === "table" ? (
            <>
              <span className={cn("shrink-0 text-[length:var(--text-micro)] uppercase tracking-[0.18em]", muted)}>
                {row.label}
              </span>
              <span className={cn("truncate text-right text-[length:var(--text-caption)]", strong)}>
                {row.value}
              </span>
            </>
          ) : (
            <>
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  tone === "dark" ? "bg-white/8 text-[var(--accent)]" : "bg-[var(--surface)] text-[var(--accent)]",
                )}
              >
                {row.icon}
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className={cn("block text-[length:var(--text-micro)] uppercase tracking-[0.16em]", muted)}>
                  {row.label}
                </span>
                <span className={cn("block truncate text-[length:var(--text-caption)]", strong)}>
                  {row.value}
                </span>
              </span>
            </>
          );

        return (
          <motion.a
            key={row.key}
            href={row.href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            onClick={() => trackClick({ profileId: id, action: row.action, preview })}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "flex items-center gap-3",
              layout === "table" && "justify-between gap-6 py-3.5",
              layout === "stacked" && "py-1.5",
              layout === "boxed" &&
                cn(
                  "rounded-[var(--radius-button)] border px-3 py-2.5",
                  tone === "dark" ? "border-white/10 bg-white/[0.03]" : "border-[var(--border)] bg-[var(--surface)]",
                ),
            )}
          >
            {content}
          </motion.a>
        );
      })}
    </div>
  );
}
