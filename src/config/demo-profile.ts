import type { PublicProfile, ThemeKey } from "@/types/profile";
import { getThemeDefinition } from "@/config/themes";
import { siteConfig } from "@/config/site";

/**
 * Profil de vitrine.
 *
 * Le heros de la page d accueil ne montre pas une capture d ecran : il rend un
 * vrai profil, avec les memes composants que ceux servis apres un scan. Ce que
 * le visiteur voit est donc exactement ce qu il achete - et le jour ou un theme
 * change, la vitrine change avec lui, sans image a refaire.
 *
 * Aucune donnee reelle : ni carte, ni compte, ni base.
 */
export function demoProfile(themeKey: ThemeKey = "aurora"): PublicProfile {
  const definition = getThemeDefinition(themeKey);

  return {
    id: "demo",
    cardToken: "APERCU",
    canonicalUrl: `${siteConfig.url}/c/APERCU`,
    seoIndexable: false,

    identity: {
      displayName: "Awa Ndiaye",
      firstName: "Awa",
      lastName: "Ndiaye",
      title: "Consultante en strategie",
      company: "Studio Meridien",
      tagline: "Strategie de marque et croissance",
      bio: "J accompagne les PME dans la structuration de leur marque et de leur offre commerciale.",
      avatarUrl: "/demo/portrait.jpg",
      coverUrl: "/demo/cover.jpg",
      logoUrl: "/demo/logo.png",
    },

    contact: {
      phone: "+237600000000",
      whatsapp: "+237600000000",
      email: "awa@studio-meridien.com",
      website: "https://studio-meridien.com",
    },

    location: {
      address: "12 avenue Kennedy",
      city: "Douala",
      country: "Cameroun",
      lat: null,
      lng: null,
      mapUrl: null,
    },

    presentation: {
      introText: null,
      availability: "Disponible pour de nouveaux projets",
      ctaLabel: "Prendre rendez-vous",
      ctaUrl: "https://cal.com/awa",
    },

    links: [
      { id: "d1", type: "EMAIL", label: "E-mail", description: "Envoyez-moi un mot", href: "mailto:awa@studio-meridien.com", icon: "Mail", color: null, style: null },
      { id: "d2", type: "WHATSAPP", label: "WhatsApp", description: "Reponse sous 2 h", href: "https://wa.me/237600000000", icon: "whatsapp", color: null, style: null },
      { id: "d3", type: "LINKEDIN", label: "LinkedIn", description: "Connectons-nous", href: "https://linkedin.com/in/awa", icon: "linkedin", color: null, style: null },
      { id: "d4", type: "INSTAGRAM", label: "Instagram", description: "Coulisses du studio", href: "https://instagram.com/studiomeridien", icon: "instagram", color: null, style: null },
      { id: "d5", type: "BOOKING", label: "Reserver un appel", description: "30 min, sans engagement", href: "https://cal.com/awa", icon: "CalendarCheck", color: null, style: null },
      { id: "d6", type: "WEBSITE", label: "Site web", description: "studio-meridien.com", href: "https://studio-meridien.com", icon: "Globe", color: null, style: null },
    ],

    theme: {
      key: themeKey,
      accentColor: definition?.defaultAccent ?? "#6366F1",
      mode: definition?.defaultMode ?? "DARK",
      variant: null,
      fontPair: null,
      buttonStyle: "SOLID",
      customConfig: {},
    },
  };
}
