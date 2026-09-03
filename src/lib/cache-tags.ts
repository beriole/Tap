/**
 * Etiquettes du cache des vues publiques.
 *
 * Elles vivent seules, sans aucune dependance, pour que le module qui invalide
 * et celui qui met en cache puissent tous deux les nommer sans s importer l un
 * l autre. Une etiquette mal orthographiee d un cote ne se voit qu en
 * production, sur un profil qui refuse de se mettre a jour : mieux vaut un
 * seul endroit qui la fabrique.
 */

/** Une carte NFC, designee par son jeton public. */
export const cardTag = (token: string) => `card:${token}`;

/** Un lien de partage restreint, designe par son slug. */
export const shareTag = (slug: string) => `share:${slug}`;
