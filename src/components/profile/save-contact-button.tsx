"use client";

import { useState } from "react";
import { Check, UserRoundPlus } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { trackClick } from "./track";

/**
 * L action principale de toute la page.
 *
 * Le visiteur est debout face au proprietaire de la carte : le seul geste qui
 * compte est d emporter le contact. C est donc le seul element pleine largeur,
 * en couleur d accent, et le seul a porter le reflet (§5.5, §5.4).
 *
 * On pointe un vrai <a> vers /api/vcard/[token] : iOS et Android ouvrent alors
 * leur fiche contact native. Un fetch() ne declencherait pas ce flux.
 */
export function SaveContactButton({
  token,
  profileId,
  name,
  preview,
  variant = "solid",
  // Tient sur une ligne des 320 px : l icone "personne +" porte deja
  // l idee du carnet d adresses, le libelle n a pas a la repeter.
  label = "Enregistrer le contact",
  className,
}: {
  token: string;
  profileId: string;
  name: string;
  preview?: boolean;
  variant?: "solid" | "outline" | "glass";
  label?: string;
  className?: string;
}) {
  const [saved, setSaved] = useState(false);

  // En apercu, la carte n existe pas : l endpoint repondrait 404. Le bouton
  // reste visible et cliquable, mais ne navigue nulle part.
  const Tag = preview ? motion.button : motion.a;
  const navigation = preview
    ? ({ type: "button" } as const)
    : ({ href: `/api/vcard/${token}`, download: `${name}.vcf` } as const);

  return (
    <Tag
      {...navigation}
      onClick={() => {
        trackClick({ profileId, action: "VCARD", preview });
        setSaved(true);
        setTimeout(() => setSaved(false), 2600);
      }}
      whileTap={{ scale: 0.975 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      aria-label={label}
      className={cn(
        "tap-target relative w-full justify-center overflow-hidden rounded-[var(--radius-button)]",
        "min-h-14 px-6 text-[0.975rem] font-semibold tracking-[-0.01em]",
        variant === "solid" && "bg-[var(--accent)] text-[var(--accent-foreground)]",
        variant === "outline" &&
          "border border-[var(--accent)] bg-transparent text-[var(--accent)]",
        variant === "glass" &&
          "border border-white/25 bg-white/12 text-white backdrop-blur-xl",
        // Le reflet est une animation CSS : globals.css la coupe sous
        // reduced-motion, sans que la classe change entre serveur et client.
        variant === "solid" && "sheen",
        className,
      )}
      style={
        variant === "solid"
          ? { boxShadow: "0 10px 30px -12px var(--glow)" }
          : undefined
      }
    >
      <span className="relative flex items-center gap-2.5">
        {saved ? <Check className="size-5" /> : <UserRoundPlus className="size-5" />}
        {saved ? "Contact pret a enregistrer" : label}
      </span>
    </Tag>
  );
}
