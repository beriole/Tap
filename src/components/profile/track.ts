"use client";

import type { ClickAction } from "@prisma/client";

/**
 * §15 - enregistrement d un clic. Envoi non bloquant : la navigation du
 * visiteur ne doit jamais attendre la reponse du serveur.
 */
export function trackClick(input: {
  profileId: string;
  linkId?: string | null;
  action: ClickAction;
  preview?: boolean;
}): void {
  if (input.preview) return; // l apercu du dashboard ne pollue pas les stats

  const body = JSON.stringify({
    profileId: input.profileId,
    linkId: input.linkId ?? null,
    action: input.action,
  });

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    navigator.sendBeacon("/api/events/click", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/events/click", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  }).catch(() => {});
}
