/**
 * Offres par evenement (D9).
 *
 * Meme approche que src/config/plans.ts pour les cartes : les limites vivent
 * dans le code, le paiement viendra en P2. Toute verification se fait cote
 * serveur - l interface ne fait qu annoncer la limite.
 */
export type EventPlanKey = "free" | "premium";

type EventPlanDefinition = {
  key: EventPlanKey;
  name: string;
  /** Groupes invites (familles, couples, personnes seules) */
  maxGroups: number;
  maxCoorganizers: number;
  maxCheckInStations: number;
  themeKeys: "all" | string[];
  exports: boolean;
};

export const EVENT_PLANS: Record<EventPlanKey, EventPlanDefinition> = {
  free: {
    key: "free",
    name: "Essentiel",
    maxGroups: 30,
    maxCoorganizers: 1,
    maxCheckInStations: 1,
    themeKeys: ["royal-ivory"],
    exports: true,
  },
  premium: {
    key: "premium",
    name: "Premium",
    maxGroups: 2000,
    maxCoorganizers: 10,
    maxCheckInStations: 10,
    themeKeys: "all",
    exports: true,
  },
};

export function eventPlan(key: string): EventPlanDefinition {
  return EVENT_PLANS[key as EventPlanKey] ?? EVENT_PLANS.free;
}
