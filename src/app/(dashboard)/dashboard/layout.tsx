import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app/shell";

/**
 * §7 - Zone client : accueil, editeur, liens, theme, apercu, stats, securite.
 *
 * L ordre suit la frequence d usage reelle : on modifie son profil et ses liens
 * souvent, on change de theme rarement, on touche a la securite une fois.
 */

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell
      space="client"
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? "",
        role: session.user.role,
      }}
    >
      {children}
    </AppShell>
  );
}
