/**
 * Politique de retention (cahier §19, decision D12), en regles PURES.
 *
 * Tout se compte a partir de la FIN de l evenement (endsAt, sinon startsAt) :
 *  - J+30  : le texte des allergies est efface (donnee de sante) ;
 *  - J+7   : les postes d accueil sont revoques (le jeton reste sur les
 *            telephones des benevoles, il ne doit plus ouvrir quoi que ce soit) ;
 *  - J+90  : l evenement passe en ARCHIVED : les liens d invitation et les QR
 *            cessent de repondre, rien n est supprime.
 *
 * Les jetons de compte expires (verification, reinitialisation, invitation
 * d un co-organisateur) sont purges des qu ils sont echus.
 *
 * Le serveur (server/events/retention.ts) applique ces seuils ; ici on ne
 * fait que les calculer, pour pouvoir les tester a la date pres.
 */

export const RETENTION_DAYS = {
  allergies: 30,
  stations: 7,
  archive: 90,
} as const;

const DAY_MS = 86_400_000;

/** Fin effective d un evenement : `endsAt`, sinon son debut. */
export function eventEnd(event: { startsAt: Date; endsAt: Date | null }): Date {
  return event.endsAt ?? event.startsAt;
}

/** Date avant laquelle un evenement doit avoir fini pour que le seuil s applique. */
export function cutoff(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

export function isDue(event: { startsAt: Date; endsAt: Date | null }, now: Date, days: number): boolean {
  return eventEnd(event).getTime() <= cutoff(now, days).getTime();
}
