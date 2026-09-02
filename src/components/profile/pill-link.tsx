"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { brandSkin } from "@/config/brand";
import { trackClick } from "./track";
import { BrandIcon } from "./brand-icon";
import type { PublicLink } from "@/types/profile";

/**
 * La pilule de marque.
 *
 * Trois informations empilees dans un seul geste : la pastille blanche porte
 * l icone du service, le libelle dit ou l on va, le sous-titre dit pourquoi
 * y aller. La couleur est celle du service lui-meme, ce qui rend la rangee
 * lisible avant meme d etre lue.
 *
 * La pastille est volontairement blanche et non transparente : sur des fonds
 * de marque tres satures (Instagram, YouTube), un logo monochrome directement
 * pose sur la couleur perd son contraste.
 */
export function PillLink({
  link,
  profileId,
  preview,
  className,
}: {
  link: PublicLink;
  profileId: string;
  preview?: boolean;
  className?: string;
}) {
  const skin = brandSkin(link.type, link.color);
  const isExternal = link.href.startsWith("http");

  return (
    <motion.a
      href={link.href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      onClick={() => trackClick({ profileId, linkId: link.id, action: "LINK", preview })}
      whileTap={{ scale: 0.98 }}
      whileHover={{ x: 3 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      className={cn(
        "flex w-full items-center gap-3 rounded-[var(--radius-pill)] py-2.5 pl-2.5 pr-5",
        "shadow-[0_6px_18px_-8px_rgb(0_0_0/0.45)]",
        className,
      )}
      style={{ background: skin.bg, color: skin.fg }}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white">
        <BrandIcon
          name={link.icon ?? link.type}
          className="size-[1.35rem]"
          // L icone reprend la couleur du service ; un degrade ne pouvant pas
          // teinter du texte, on retombe sur un gris tres fonce.
          style={{ color: skin.bg.startsWith("#") ? skin.bg : "#1f2937" }}
        />
      </span>

      <span className="min-w-0 text-left leading-tight">
        <span className="block truncate text-[0.95rem] font-bold">{link.label}</span>
        {link.description && (
          <span className="block truncate text-[0.8rem] opacity-90">{link.description}</span>
        )}
      </span>
    </motion.a>
  );
}
