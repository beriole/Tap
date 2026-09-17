/**
 * Regles de l accueil (cahier §10, D2, D4) - logique pure, testee.
 *
 * Un ticket par groupe, N places = personnes confirmees. L entree peut etre
 * totale ou partielle ("3 sur 5 sont arrives"). Une place ne s enregistre
 * qu une fois : un lien transfere ne cree aucune place supplementaire.
 */

/** Le QR porte un code opaque de 32 octets (43 caracteres base64url). */
export function isTicketCode(value: string): boolean {
  return /^[A-Za-z0-9_-]{32,64}$/.test(value);
}

/**
 * Le QR contient une URL complete : un lecteur de QR generique (appareil
 * photo) ouvre alors la page du ticket, et le poste d accueil sait extraire
 * le code de la meme chaine. Le code seul est aussi accepte.
 */
export function ticketUrl(baseUrl: string, code: string): string {
  return `${baseUrl}/t/${code}`;
}

export function extractTicketCode(scanned: string): string | null {
  const trimmed = scanned.trim();
  const fromUrl = trimmed.match(/\/t\/([A-Za-z0-9_-]{32,64})(?:[/?#]|$)/)?.[1];
  const code = fromUrl ?? trimmed;
  return isTicketCode(code) ? code : null;
}

export type TicketState = {
  seats: number;
  seatsUsed: number;
  cancelledAt: Date | null;
  eventStatus: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
};

export type TicketVerdict =
  | { kind: "valid"; remaining: number }
  | { kind: "partial"; remaining: number }
  | { kind: "used" }
  | { kind: "cancelled" }
  | { kind: "not_open" };

/** Ce que le poste affiche AVANT d enregistrer : la situation du ticket. */
export function ticketVerdict(t: TicketState): TicketVerdict {
  if (t.cancelledAt) return { kind: "cancelled" };
  if (t.eventStatus !== "PUBLISHED" && t.eventStatus !== "CLOSED") return { kind: "not_open" };
  const remaining = t.seats - t.seatsUsed;
  if (remaining <= 0) return { kind: "used" };
  if (t.seatsUsed > 0) return { kind: "partial", remaining };
  return { kind: "valid", remaining };
}

export const VERDICT_LABELS: Record<TicketVerdict["kind"], { title: string; tone: "ok" | "warn" | "stop" }> = {
  valid: { title: "Bienvenue", tone: "ok" },
  partial: { title: "Entrée partielle en cours", tone: "warn" },
  used: { title: "Déjà entrés", tone: "stop" },
  cancelled: { title: "Invitation annulée", tone: "stop" },
  not_open: { title: "Événement non ouvert", tone: "stop" },
};

/**
 * Quantite a enregistrer pour une demande : jamais plus que le restant, sauf
 * entree forcee explicite (journalisee). Zero si rien n est possible.
 */
export function admissionQuantity(t: TicketState, requested: number, override = false): { quantity: number; forced: boolean } {
  const verdict = ticketVerdict(t);
  const wanted = Math.max(0, Math.floor(requested));
  if (!override && (verdict.kind === "used" || verdict.kind === "cancelled" || verdict.kind === "not_open")) return { quantity: 0, forced: false };
  const remaining = Math.max(0, t.seats - t.seatsUsed);
  if (override) return { quantity: wanted, forced: wanted > remaining || verdict.kind !== "valid" && verdict.kind !== "partial" };
  return { quantity: Math.min(wanted, remaining), forced: false };
}

/** PIN a 4 chiffres, sans suite evidente : "0000" ou "1234" a l accueil d un mariage, non. */
export function isAcceptablePin(pin: string): boolean {
  if (!/^\d{4}$/.test(pin)) return false;
  if (/^(\d)\1{3}$/.test(pin)) return false;
  const digits = pin.split("").map(Number);
  const ascending = digits.every((d, i) => i === 0 || d === digits[i - 1]! + 1);
  const descending = digits.every((d, i) => i === 0 || d === digits[i - 1]! - 1);
  return !ascending && !descending;
}

export function generatePin(random: () => number = Math.random): string {
  for (let i = 0; i < 100; i += 1) {
    const pin = String(Math.floor(random() * 10_000)).padStart(4, "0");
    if (isAcceptablePin(pin)) return pin;
  }
  return "7391";
}
