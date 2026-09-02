/**
 * §11 - "Les URL personnalisees doivent etre validees et les protocoles
 * dangereux interdits." Toute valeur de lien passe par ici avant enregistrement
 * ET avant rendu public.
 */

const ALLOWED_PROTOCOLS = new Set(["https:", "http:", "mailto:", "tel:", "sms:"]);
const BLOCKED_PROTOCOLS = ["javascript:", "data:", "vbscript:", "file:", "blob:", "about:"];

export type UrlCheck = { ok: true; href: string } | { ok: false; reason: string };

export function sanitizeHref(raw: string): UrlCheck {
  const value = raw.trim();
  if (!value) return { ok: false, reason: "Valeur vide." };

  // Neutralise les esquives par espaces, tabulations ou tirets inseres.
  const lowered = value.toLowerCase().replace(/[\s-]/g, "");
  if (BLOCKED_PROTOCOLS.some((p) => lowered.startsWith(p.replace("-", "")))) {
    return { ok: false, reason: "Protocole interdit." };
  }

  // tel: / mailto: / sms: sont acceptes tels quels apres normalisation.
  if (/^(tel|mailto|sms):/i.test(value)) return { ok: true, href: value };

  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, reason: "URL invalide." };
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) return { ok: false, reason: "Protocole interdit." };
  if (url.protocol === "http:" && process.env.NODE_ENV === "production") {
    url.protocol = "https:"; // §12 - HTTPS obligatoire sur toute la plateforme
  }
  if (!url.hostname.includes(".")) return { ok: false, reason: "Domaine invalide." };

  return { ok: true, href: url.toString() };
}

/** Version stricte pour les liens personnalises du client : HTTPS uniquement. */
export function sanitizeHttpsUrl(raw: string): UrlCheck {
  const checked = sanitizeHref(raw);
  if (!checked.ok) return checked;
  if (!checked.href.startsWith("https://")) return { ok: false, reason: "HTTPS requis." };
  return checked;
}
