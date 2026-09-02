"use client";

import { LinkButton, type LinkVariant } from "./link-button";
import { Reveal } from "./stage";
import type { PublicLink } from "@/types/profile";

/**
 * Les liens se deposent a mesure qu ils entrent dans le champ.
 *
 * Une liste peut compter dix entrees : les jouer toutes au chargement les
 * ferait apparaitre hors de l ecran, donc invisibles. Le decalage est plafonne
 * pour que le bas de liste n attende jamais plus d un quart de seconde.
 */
export function LinkList({
  links,
  profileId,
  variant = "outline",
  preview,
  columns = 1,
}: {
  links: PublicLink[];
  profileId: string;
  variant?: LinkVariant;
  preview?: boolean;
  columns?: 1 | 2;
}) {
  if (links.length === 0) return null;

  return (
    <ul className={columns === 2 ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"}>
      {links.map((link, index) => (
        <Reveal key={link.id} as="li" delay={Math.min(index, 5) * 0.05}>
          <LinkButton link={link} profileId={profileId} variant={variant} preview={preview} />
        </Reveal>
      ))}
    </ul>
  );
}
