"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { socialLinks } from "@/lib/link-groups";
import { trackClick } from "./track";
import { BrandIcon } from "./brand-icon";
import type { PublicLink } from "@/types/profile";


/**
 * Le rail vertical de reseaux, colle au bord droit de la photo.
 *
 * Il sort les reseaux de la liste principale : sur une carte de visite, ils ne
 * sont pas des actions, ce sont une signature. Le pseudo est ecrit a la
 * verticale le long du rail, comme une tranche de livre.
 */
export function SocialRail({
  links,
  profileId,
  handle,
  preview,
  className,
}: {
  links: PublicLink[];
  profileId: string;
  /** Pseudo affiche a la verticale, ex. "@mattbradleyrealty". */
  handle?: string | null;
  preview?: boolean;
  className?: string;
}) {
  const socials = socialLinks(links);
  if (socials.length === 0) return null;

  return (
    <div className={cn("flex flex-col items-center gap-2.5", className)}>
      {socials.slice(0, 4).map((link) => (
        <motion.a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick({ profileId, linkId: link.id, action: "LINK", preview })}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.08 }}
          aria-label={link.label}
          className="flex size-8 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)]"
        >
          <BrandIcon name={link.icon ?? link.type} className="size-4" />
        </motion.a>
      ))}

      {handle && (
        <span
          className="mt-1 text-[0.62rem] tracking-wide text-[var(--muted)]"
          style={{ writingMode: "vertical-rl" }}
        >
          {handle}
        </span>
      )}
    </div>
  );
}
