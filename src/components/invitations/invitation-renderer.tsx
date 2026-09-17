import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { InvitationThemeKey } from "@/config/invitation-themes";
import type { InvitationView } from "@/types/invitation";

/**
 * Registre des themes d invitation.
 *
 * Meme principe que les cartes (docs/themes.md) : un theme est un composant,
 * charge dynamiquement - une invitation ne telecharge que le sien, polices
 * comprises. Tous recoivent la meme InvitationView ; changer de theme ne
 * change que le rendu, jamais les donnees.
 */
const THEMES: Record<InvitationThemeKey, ComponentType<{ view: InvitationView }>> = {
  "royal-ivory": dynamic(() => import("./themes/royal-ivory/theme").then((m) => m.RoyalIvory)),
};

export function InvitationRenderer({ view }: { view: InvitationView }) {
  const Theme = THEMES[view.theme.key] ?? THEMES["royal-ivory"];
  return <Theme view={view} />;
}
