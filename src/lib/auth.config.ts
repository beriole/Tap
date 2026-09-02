import type { Role, UserStatus } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";

/**
 * Configuration edge-safe (sans Prisma) consommee par le middleware.
 * Les providers necessitant la base vivent dans lib/auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;

      if (pathname.startsWith("/admin")) return role === "ADMIN" || role === "SUPERADMIN";
      if (pathname.startsWith("/dashboard")) return Boolean(auth?.user);
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        // Le JWT est opaque cote types : role et status y ont ete places par le
        // callback jwt ci-dessus, on les reprojette explicitement.
        session.user.id = token.sub as string;
        session.user.role = token.role as Role;
        session.user.status = token.status as UserStatus;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
