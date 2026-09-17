/**
 * Regles d acces a une invitation par son jeton - logique pure, testee.
 */

/** Jeton de 32 octets en base64url : 43 caracteres. On tolere une marge, rien d autre. */
export function isInvitationToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{32,64}$/.test(value);
}

export type InvitationGate = {
  revokedAt: Date | null;
  expiresAt: Date | null;
  eventStatus: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
};

/**
 * Une invitation est lisible si son lien n est ni revoque ni expire, et si
 * l evenement est publie - ou clos : apres la date limite, l invite doit
 * encore retrouver l adresse et l heure.
 *
 * Toute autre situation donne la MEME page neutre : un lien revoque, un
 * brouillon et un jeton invente sont indiscernables de l exterieur.
 */
export function canReadInvitation(gate: InvitationGate, now = new Date()): boolean {
  if (gate.revokedAt) return false;
  if (gate.expiresAt && gate.expiresAt <= now) return false;
  return gate.eventStatus === "PUBLISHED" || gate.eventStatus === "CLOSED";
}

export type InvitationState = "CREATED" | "SHARED" | "OPENED" | "RESPONDED" | "REVOKED";

/** Une ouverture fait avancer l etat, jamais reculer : une invitation repondue reste repondue. */
export function stateAfterOpen(state: InvitationState): InvitationState {
  return state === "CREATED" || state === "SHARED" ? "OPENED" : state;
}
