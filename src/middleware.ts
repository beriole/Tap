import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Le middleware n embarque que la config edge-safe : le controle d acces fin
 * (propriete de la ressource) reste fait cote serveur dans chaque route (§12).
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Les profils publics /c/:token ne passent jamais par l authentification.
  matcher: ["/dashboard/:path*", "/admin/:path*", "/preview/:path*"],
};
