"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { trackClick } from "./track";
import { BrandIcon } from "./brand-icon";
import type { PublicLink } from "@/types/profile";

export type LinkVariant = "solid" | "outline" | "glass" | "ghost" | "icon";

/**
 * Une ligne de lien, commune a tous les themes.
 *
 * Trois signaux, dans cet ordre de lecture : l icone dit de quoi il s agit, le
 * libelle dit ou l on va, la fleche dit que ca ouvre ailleurs. La fleche glisse
 * au survol - c est la seule micro-animation de la ligne, et elle porte une
 * information (sortie du site) plutot qu un effet.
 */
export function LinkButton({
  link,
  profileId,
  variant = "outline",
  preview,
  className,
}: {
  link: PublicLink;
  profileId: string;
  variant?: LinkVariant;
  preview?: boolean;
  className?: string;
}) {
  const isExternal = link.href.startsWith("http");

  return (
    <motion.a
      href={link.href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      whileTap={{ scale: 0.985 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onClick={() => trackClick({ profileId, linkId: link.id, action: "LINK", preview })}
      className={cn(
        "group tap-target w-full justify-between px-4 text-[0.9375rem] font-medium",
        "transition-colors duration-200",
        variant === "solid" &&
          "rounded-[var(--radius-button)] bg-[var(--accent)] text-[var(--accent-foreground)]",
        variant === "outline" &&
          "rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]",
        variant === "glass" &&
          "rounded-[var(--radius-button)] border border-white/15 bg-white/8 text-white backdrop-blur-md hover:bg-white/14",
        variant === "ghost" &&
          "rounded-[var(--radius-pill)] border border-[var(--border)] hover:border-[var(--accent)]",
        variant === "icon" &&
          "aspect-square w-auto justify-center rounded-[var(--radius-button)] border border-[var(--border)] px-0",
        className,
      )}
      style={link.color ? { borderColor: link.color } : undefined}
    >
      <span className="flex min-w-0 items-center gap-3">
        <BrandIcon name={link.icon ?? link.type} className="size-[1.15rem] shrink-0" />
        {variant !== "icon" && <span className="truncate">{link.label}</span>}
      </span>

      {variant !== "icon" && isExternal && (
        <ArrowUpRight
          aria-hidden
          className="size-4 shrink-0 opacity-35 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-80"
        />
      )}
    </motion.a>
  );
}
