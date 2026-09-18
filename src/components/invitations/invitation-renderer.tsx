import type { ComponentType } from "react";
import type { InvitationThemeKey } from "@/config/invitation-themes";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { AfricanLuxury } from "./themes/african-luxury/theme";
import { Botanical } from "./themes/botanical/theme";
import { Classic } from "./themes/classic/theme";
import { Conference } from "./themes/conference/theme";
import { Editorial } from "./themes/editorial/theme";
import { Elegant } from "./themes/elegant/theme";
import { Executive } from "./themes/executive/theme";
import { Gala } from "./themes/gala/theme";
import { Kids } from "./themes/kids/theme";
import { Launch } from "./themes/launch/theme";
import { Light } from "./themes/light/theme";
import { MidnightGold } from "./themes/midnight-gold/theme";
import { Minimal } from "./themes/minimal/theme";
import { ModernGlass } from "./themes/modern-glass/theme";
import { Neon } from "./themes/neon/theme";
import { Party } from "./themes/party/theme";
import { Pearl } from "./themes/pearl/theme";
import { Romantic } from "./themes/romantic/theme";
import { RoyalIvory } from "./themes/royal-ivory/theme";
import { Serenity } from "./themes/serenity/theme";

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
  pearl: Pearl,
  "african-luxury": AfricanLuxury,
  romantic: Romantic,
  "modern-glass": ModernGlass,
  party: Party,
  kids: Kids,
  elegant: Elegant,
  neon: Neon,
  minimal: Minimal,
  executive: Executive,
  conference: Conference,
  gala: Gala,
  launch: Launch,
  serenity: Serenity,
  classic: Classic,
  light: Light,
};

export function InvitationRenderer({ view, rsvpForm }: ThemeProps) {
  const Theme = THEMES[view.theme.key] ?? THEMES["royal-ivory"];
  return <Theme view={view} rsvpForm={rsvpForm} />;
}
