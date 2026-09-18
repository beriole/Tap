import type { ComponentType } from "react";
import type { InvitationThemeKey } from "@/config/invitation-themes";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { AfricanLuxury } from "./themes/african-luxury/theme";
import { Botanical } from "./themes/botanical/theme";
import { Editorial } from "./themes/editorial/theme";
import { MidnightGold } from "./themes/midnight-gold/theme";
import { RoyalIvory } from "./themes/royal-ivory/theme";

/**
 * Registre des themes d invitation.
 *
 * Import statique : les themes sont des composants serveur, un import direct
 * n ajoute rien au JavaScript envoye au navigateur. Verifie en phase 9 : un
 * import dynamique par theme ne change rien non plus a la feuille de style,
 * Next y rassemble les @font-face de tout le graphe de la page (21 ko bruts,
 * ~4 ko compresses, pour cinq themes). Les fichiers de police, eux, ne sont
 * telecharges que pour le theme rendu.
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
  "midnight-gold": MidnightGold,
  botanical: Botanical,
  editorial: Editorial,
  "african-luxury": AfricanLuxury,
};

export function InvitationRenderer({ view, rsvpForm }: ThemeProps) {
  const Theme = THEMES[view.theme.key] ?? THEMES["royal-ivory"];
  return <Theme view={view} rsvpForm={rsvpForm} />;
}
