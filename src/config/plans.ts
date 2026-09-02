import type { PlanKey } from "@prisma/client";

type PlanDefinition = {
  key: PlanKey;
  name: string;
  maxLinks: number;
  themeKeys: "all" | string[];
  customAccentColor: boolean;
  analytics: boolean;
};

/** §2 - base evolutive pour offres gratuite, Premium et Business (facturation en P2). */
export const PLANS: Record<PlanKey, PlanDefinition> = {
  FREE: {
    key: "FREE",
    name: "Gratuit",
    maxLinks: 6,
    themeKeys: ["minimal", "compact"],
    customAccentColor: false,
    analytics: false,
  },
  PREMIUM: {
    key: "PREMIUM",
    name: "Premium",
    maxLinks: 30,
    themeKeys: "all",
    customAccentColor: true,
    analytics: true,
  },
  BUSINESS: {
    key: "BUSINESS",
    name: "Business",
    maxLinks: 100,
    themeKeys: "all",
    customAccentColor: true,
    analytics: true,
  },
};
