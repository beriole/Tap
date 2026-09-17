/**
 * Permissions par evenement (D5) - logique pure, sans base de donnees.
 *
 * Le proprietaire a tout. Un co-organisateur n a que ce qui lui a ete
 * explicitement accorde : une permission ajoutee au produit demain ne lui
 * sera donc pas donnee par defaut.
 *
 * Aucune permission ne s obtient par le role global : un ADMIN de la
 * plateforme ne lit pas la liste d invites d un mariage par ce chemin. Le
 * support passe par le back-office, ou chaque consultation est journalisee.
 */
export const EVENT_PERMISSIONS = [
  "design",
  "guests",
  "messages",
  "checkin",
  "exports",
  /** Allergies, notes internes (D12) */
  "sensitive",
  /** Inviter ou retirer des co-organisateurs */
  "team",
] as const;

export type EventPermission = (typeof EVENT_PERMISSIONS)[number];

/** "view" : lire l evenement et ses chiffres, sans rien modifier. */
export type EventAccessNeed = EventPermission | "view";

export type EventMembership = {
  role: "OWNER" | "COORGANIZER";
  permissions: readonly string[];
};

export function canAccessEvent(member: EventMembership | null | undefined, need: EventAccessNeed): boolean {
  if (!member) return false;
  if (member.role === "OWNER") return true;
  // L equipe ne se gere que par le proprietaire, quelle que soit la liste.
  if (need === "team") return false;
  if (need === "view") return true;
  return member.permissions.includes(need);
}

export function isEventPermission(value: string): value is EventPermission {
  return (EVENT_PERMISSIONS as readonly string[]).includes(value);
}
