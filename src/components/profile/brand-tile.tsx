"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { brandSkin } from "@/config/brand";
import { trackClick } from "./track";
import { BrandIcon } from "./brand-icon";
import type { PublicLink } from "@/types/profile";

/**
 * La grille d applications.
 *
 * Meme grammaire qu un ecran d accueil de telephone : une tuile carree aux
 * couleurs du service, le nom dessous. Le visiteur ne lit pas, il reconnait -
 * c est la facon la plus rapide de presenter beaucoup de liens sans mur de
 * boutons.
 *
 * Trois colonnes : au-dela, les tuiles descendent sous 64 px et les logos de
 * marque deviennent illisibles sur un petit ecran.
 */
export function BrandTileGrid({
  links,
  profileId,
  preview,
  className,
}: {
  links: PublicLink[];
  profileId: string;
  preview?: boolean;
  className?: string;
}) {
  if (links.length === 0) return null;

  return (
    <ul className={cn("grid grid-cols-3 gap-x-3 gap-y-5", className)}>
      {links.map((link) => (
        <li key={link.id}>
          <BrandTile link={link} profileId={profileId} preview={preview} />
        </li>
      ))}
    </ul>
  );
}

function BrandTile({
  link,
  profileId,
  preview,
}: {
  link: PublicLink;
  profileId: string;
  preview?: boolean;
}) {
  const skin = brandSkin(link.type, link.color);
  const isExternal = link.href.startsWith("http");

  return (
    <motion.a
      href={link.href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      onClick={() => trackClick({ profileId, linkId: link.id, action: "LINK", preview })}
      whileTap={{ scale: 0.92 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className="flex flex-col items-center gap-2"
    >
      <span
        className="flex aspect-square w-full max-w-[4.5rem] items-center justify-center rounded-[1.35rem] shadow-[0_8px_20px_-10px_rgb(0_0_0/0.5)]"
        style={{ background: skin.bg, color: skin.fg }}
      >
        <BrandIcon name={link.icon ?? link.type} className="size-8" />
      </span>
      <span className="w-full truncate text-center text-[0.7rem] font-medium text-[var(--muted)]">
        {link.label}
      </span>
    </motion.a>
  );
}
