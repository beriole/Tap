import type { ComponentType } from "react";
import type { InvitationThemeKey } from "@/config/invitation-themes";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { RoyalIvory } from "./themes/royal-ivory/theme";

/**
 * Registre des themes d invitation.
 *
 * Import statique : les themes sont des composants serveur, un import direct
 * n ajoute rien au JavaScript envoye au navigateur.
 *
 * A savoir (mesure en 4G lente, processeur ralenti) : l application n emet
 * aujourd hui AUCUN <link rel="preload"> de police, ni pour les polices
 * globales ni pour celles des themes. Les polices partent apres la feuille de
 * style (~1,5 s). Le premier ecran de l invitation n en depend pas pour
 * s afficher (display: swap, et aucune animation sur l essentiel), mais les
 * noms changent de police a l arrivee de Bodoni Moda. A traiter pour toute
 * l application, cartes NFC comprises.
 */
type ThemeProps = { view: InvitationView; rsvpForm?: RsvpFormData | null };

const THEMES: Record<InvitationThemeKey, ComponentType<ThemeProps>> = {
  "royal-ivory": RoyalIvory,
};

export function InvitationRenderer({ view, rsvpForm }: ThemeProps) {
  const Theme = THEMES[view.theme.key] ?? THEMES["royal-ivory"];
  return <Theme view={view} rsvpForm={rsvpForm} />;
}
