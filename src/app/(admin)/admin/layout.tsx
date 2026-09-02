import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app/shell";

/** §16 - Back-office. Acces reserve aux roles ADMIN et SUPERADMIN. */

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user) redirect("/login");
  if (role !== "ADMIN" && role !== "SUPERADMIN") redirect("/dashboard");

  return (
    <AppShell
      space="admin"
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? "",
        role,
      }}
    >
      {children}
    </AppShell>
  );
}
