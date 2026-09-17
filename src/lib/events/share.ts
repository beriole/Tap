/**
 * Partage des invitations (cahier §6.1, §11) - logique pure, testee.
 *
 * Au MVP, rien ne part tout seul : on PREPARE un message et un lien, et
 * l organisateur confirme l envoi depuis son propre WhatsApp. Pas de compte
 * WhatsApp Business, pas de cout, pas de numero bloque pour spam.
 */

export const DEFAULT_SHARE_TEMPLATE = `Bonjour {prenom},

{hotes} ont le plaisir de vous inviter : {titre}, le {date}.

Votre invitation personnelle : {lien}`;

export type ShareVariables = {
  prenom: string;
  hotes: string;
  titre: string;
  date: string;
  lien: string;
};

export const SHARE_PLACEHOLDERS: { key: keyof ShareVariables; label: string }[] = [
  { key: "prenom", label: "Prénom ou nom du groupe" },
  { key: "hotes", label: "Hôtes" },
  { key: "titre", label: "Titre de l’événement" },
  { key: "date", label: "Date" },
  { key: "lien", label: "Lien personnel" },
];

/**
 * Remplace les {variables}. Une variable inconnue est laissee telle quelle :
 * l organisateur la voit dans l apercu et corrige, plutot que de voir un trou.
 * Le lien est TOUJOURS present : s il manque au modele, il est ajoute a la fin.
 * Un message sans lien ne sert a rien et c est l oubli le plus probable.
 */
export function renderShareMessage(template: string, vars: ShareVariables): string {
  const source = template.trim() || DEFAULT_SHARE_TEMPLATE;
  const text = source.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? vars[key as keyof ShareVariables] : match,
  );
  return source.includes("{lien}") ? text : `${text}\n\n${vars.lien}`;
}

/** Salutation : un ou deux prenoms, sinon le nom du groupe. */
export function greetingName(groupName: string, firstNames: string[]): string {
  const names = firstNames.filter(Boolean);
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} et ${names[1]}`;
  return groupName;
}

/** Lien d ouverture de WhatsApp avec le message pre-rempli. */
export function whatsappShareUrl(e164: string | null, message: string): string {
  const text = encodeURIComponent(message);
  // Sans numero, WhatsApp ouvre le choix du destinataire : utile pour un groupe familial.
  return e164 ? `https://wa.me/${e164.replace(/\D/g, "")}?text=${text}` : `https://wa.me/?text=${text}`;
}

export type InvitationState = "CREATED" | "SHARED" | "OPENED" | "RESPONDED" | "REVOKED";

/** Marquer "envoyee" ne fait jamais reculer une invitation deja ouverte ou repondue. */
export function stateAfterShare(state: InvitationState): InvitationState {
  return state === "CREATED" ? "SHARED" : state;
}

/**
 * Etat apres regeneration du lien : l ancien jeton est mort, le nouveau n a
 * pas encore ete envoye. Une reponse deja donnee reste acquise.
 */
export function stateAfterRegenerate(hasResponse: boolean): InvitationState {
  return hasResponse ? "RESPONDED" : "CREATED";
}
