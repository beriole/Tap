import type { LinkType } from "@prisma/client";

export type LinkCategory =
  | "communication"
  | "reseaux"
  | "professionnel"
  | "business"
  | "localisation"
  | "personnalise";

export type LinkTypeDefinition = {
  type: LinkType;
  label: string;
  category: LinkCategory;
  /** Nom d icone Lucide, ou cle de marque rendue par BrandIcon. */
  icon: string;
  /** Gabarit de valeur attendu dans l editeur. */
  input: "tel" | "email" | "url" | "handle";
  placeholder: string;
  /** Construit le href final a partir de la valeur saisie. */
  toHref: (value: string) => string;
};

const asUrl = (v: string) => (/^https?:\/\//i.test(v) ? v : `https://${v}`);
const digits = (v: string) => v.replace(/[^\d+]/g, "");

/**
 * §5.3 - Le systeme ne depend pas d une liste fermee : ce registre couvre les
 * types natifs, CUSTOM accepte toute URL HTTPS validee (voir lib/url-safety).
 */
export const LINK_TYPES: Record<LinkType, LinkTypeDefinition> = {
  PHONE: { type: "PHONE", label: "Telephone", category: "communication", icon: "Phone", input: "tel", placeholder: "+237 6 00 00 00 00", toHref: (v) => `tel:${digits(v)}` },
  WHATSAPP: { type: "WHATSAPP", label: "WhatsApp", category: "communication", icon: "whatsapp", input: "tel", placeholder: "+237 6 00 00 00 00", toHref: (v) => `https://wa.me/${digits(v).replace(/^\+/, "")}` },
  EMAIL: { type: "EMAIL", label: "E-mail", category: "communication", icon: "Mail", input: "email", placeholder: "contact@exemple.com", toHref: (v) => `mailto:${v}` },
  TELEGRAM: { type: "TELEGRAM", label: "Telegram", category: "communication", icon: "telegram", input: "handle", placeholder: "@pseudo", toHref: (v) => `https://t.me/${v.replace(/^@/, "")}` },
  MESSENGER: { type: "MESSENGER", label: "Messenger", category: "communication", icon: "messenger", input: "handle", placeholder: "pseudo", toHref: (v) => `https://m.me/${v}` },

  LINKEDIN: { type: "LINKEDIN", label: "LinkedIn", category: "reseaux", icon: "linkedin", input: "url", placeholder: "linkedin.com/in/pseudo", toHref: asUrl },
  INSTAGRAM: { type: "INSTAGRAM", label: "Instagram", category: "reseaux", icon: "instagram", input: "handle", placeholder: "@pseudo", toHref: (v) => `https://instagram.com/${v.replace(/^@/, "")}` },
  FACEBOOK: { type: "FACEBOOK", label: "Facebook", category: "reseaux", icon: "facebook", input: "url", placeholder: "facebook.com/page", toHref: asUrl },
  TIKTOK: { type: "TIKTOK", label: "TikTok", category: "reseaux", icon: "tiktok", input: "handle", placeholder: "@pseudo", toHref: (v) => `https://tiktok.com/@${v.replace(/^@/, "")}` },
  X: { type: "X", label: "X", category: "reseaux", icon: "x", input: "handle", placeholder: "@pseudo", toHref: (v) => `https://x.com/${v.replace(/^@/, "")}` },
  YOUTUBE: { type: "YOUTUBE", label: "YouTube", category: "reseaux", icon: "youtube", input: "url", placeholder: "youtube.com/@chaine", toHref: asUrl },

  GITHUB: { type: "GITHUB", label: "GitHub", category: "professionnel", icon: "github", input: "handle", placeholder: "pseudo", toHref: (v) => `https://github.com/${v}` },
  BEHANCE: { type: "BEHANCE", label: "Behance", category: "professionnel", icon: "behance", input: "handle", placeholder: "pseudo", toHref: (v) => `https://behance.net/${v}` },
  DRIBBBLE: { type: "DRIBBBLE", label: "Dribbble", category: "professionnel", icon: "dribbble", input: "handle", placeholder: "pseudo", toHref: (v) => `https://dribbble.com/${v}` },
  PORTFOLIO: { type: "PORTFOLIO", label: "Portfolio", category: "professionnel", icon: "LayoutGrid", input: "url", placeholder: "monportfolio.com", toHref: asUrl },
  RESUME: { type: "RESUME", label: "CV", category: "professionnel", icon: "FileText", input: "url", placeholder: "lien vers le CV (PDF)", toHref: asUrl },
  WEBSITE: { type: "WEBSITE", label: "Site web", category: "professionnel", icon: "Globe", input: "url", placeholder: "monsite.com", toHref: asUrl },

  SHOP: { type: "SHOP", label: "Boutique", category: "business", icon: "ShoppingBag", input: "url", placeholder: "maboutique.com", toHref: asUrl },
  CATALOG: { type: "CATALOG", label: "Catalogue", category: "business", icon: "BookOpen", input: "url", placeholder: "lien du catalogue", toHref: asUrl },
  MENU: { type: "MENU", label: "Menu", category: "business", icon: "UtensilsCrossed", input: "url", placeholder: "lien du menu", toHref: asUrl },
  BOOKING: { type: "BOOKING", label: "Reservation", category: "business", icon: "CalendarCheck", input: "url", placeholder: "cal.com/pseudo", toHref: asUrl },
  FORM: { type: "FORM", label: "Formulaire", category: "business", icon: "ClipboardList", input: "url", placeholder: "lien du formulaire", toHref: asUrl },
  PAYMENT: { type: "PAYMENT", label: "Paiement", category: "business", icon: "CreditCard", input: "url", placeholder: "lien de paiement", toHref: asUrl },

  MAPS: { type: "MAPS", label: "Itineraire", category: "localisation", icon: "MapPin", input: "url", placeholder: "maps.google.com/...", toHref: asUrl },

  CUSTOM: { type: "CUSTOM", label: "Lien personnalise", category: "personnalise", icon: "Link", input: "url", placeholder: "https://...", toHref: asUrl },
};

export const LINK_CATEGORIES: { key: LinkCategory; label: string }[] = [
  { key: "communication", label: "Communication" },
  { key: "reseaux", label: "Reseaux" },
  { key: "professionnel", label: "Professionnel" },
  { key: "business", label: "Business" },
  { key: "localisation", label: "Localisation" },
  { key: "personnalise", label: "Personnalise" },
];

export function linkTypesByCategory(category: LinkCategory): LinkTypeDefinition[] {
  return Object.values(LINK_TYPES).filter((d) => d.category === category);
}
