"use client";

import { useEffect } from "react";

/**
 * Signale l ouverture reelle d une invitation (voir /api/invitations/open).
 * Une fois par chargement de page ; keepalive pour survivre a une fermeture
 * immediate de l onglet.
 */
export function OpenBeacon({ token }: { token: string }) {
  useEffect(() => {
    void fetch("/api/invitations/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      keepalive: true,
    }).catch(() => undefined);
  }, [token]);
  return null;
}
