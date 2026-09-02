"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  Eye,
  LayoutDashboard,
  Link2,
  LogOut,
  Palette,
  Settings,
  Loader2,
  Shield,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { cn, initials } from "@/lib/utils";
import { logout } from "@/app/(auth)/actions";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

export type Space = "client" | "admin";

/**
 * Les navigations vivent ICI, dans le module client.
 *
 * Une icone est un composant : la passer en prop depuis un composant serveur
 * fait echouer le rendu ("Functions cannot be passed directly to Client
 * Components"). Le layout ne transmet donc qu une chaine.
 *
 * L ordre suit la frequence d usage reelle, pas la structure du cahier des
 * charges : on modifie son profil souvent, sa securite une fois.
 */
const NAVS: Record<Space, NavItem[]> = {
  client: [
    { href: "/dashboard", label: "Accueil", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/profile", label: "Profil", icon: User },
    { href: "/dashboard/links", label: "Liens", icon: Link2 },
    { href: "/dashboard/theme", label: "Theme", icon: Palette },
    { href: "/dashboard/stats", label: "Stats", icon: BarChart3 },
    { href: "/dashboard/preview", label: "Apercu", icon: Eye },
    { href: "/dashboard/security", label: "Securite", icon: Shield },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/cards", label: "Cartes", icon: CreditCard },
    { href: "/admin/clients", label: "Clients", icon: Users },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/themes", label: "Themes", icon: Palette },
    { href: "/admin/settings", label: "Parametres", icon: Settings },
  ],
};

/**
 * Coquille des espaces client et administrateur.
 *
 * Deux navigations pour deux gestes differents :
 *  - au clavier et a la souris, une colonne fixe a gauche ;
 *  - au pouce, une barre d onglets en bas.
 *
 * L ancienne version imposait aux telephones une rangee horizontale a faire
 * defiler, ou les dernieres entrees etaient invisibles.
 */
/**
 * Retour visuel du clic.
 *
 * Le routeur garde la page courante a l ecran tant que la suivante n est pas
 * prete. Sans indicateur, un onglet lent parait mort - on clique, rien ne
 * bouge, on conclut que ca ne marche pas. useLinkStatus expose l attente du
 * lien PARENT ; ce composant doit donc etre rendu a l interieur du <Link>.
 */
function LinkSpinner({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <Loader2 aria-hidden className={cn("size-3.5 animate-spin", className)} />;
}

export function AppShell({
  space,
  user,
  children,
}: {
  space: Space;
  user: { name: string | null; email: string; role: string };
  children: React.ReactNode;
}) {
  const nav = NAVS[space];
  const pathname = usePathname();
  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-dvh bg-[var(--surface)]">
      {/* Colonne fixe - ecrans larges */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-[var(--brand-line)] bg-[var(--brand-ink)] p-4 lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-2 py-3">
          <LogoMark className="h-6 text-[var(--brand-paper)]" />
          <span className="font-[family-name:var(--font-grotesk)] text-[1.05rem] font-bold tracking-[-0.03em] text-[var(--brand-paper)]">
            Tap
          </span>
        </Link>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.88rem] transition-colors",
                isActive(item)
                  ? "bg-white/10 font-medium text-[var(--brand-paper)]"
                  : "text-white/45 hover:bg-white/5 hover:text-white/80",
              )}
            >
              <item.icon className="size-[1.05rem] shrink-0" />
              <span className="flex-1">{item.label}</span>
              <LinkSpinner />
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/8 pt-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-copper)] text-[0.7rem] font-bold text-[#231206]">
              {initials(user.name ?? user.email)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.78rem] font-medium text-[var(--brand-paper)]">
                {user.name ?? "Compte"}
              </span>
              <span className="block truncate text-[0.68rem] text-white/35">{user.email}</span>
            </span>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.82rem] text-white/40 transition-colors hover:bg-white/5 hover:text-white/80"
            >
              <LogOut className="size-4" />
              Se deconnecter
            </button>
          </form>
        </div>
      </aside>

      {/* Barre superieure - petits ecrans */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark className="h-5 text-[var(--brand-ink)]" lineColor="var(--brand-paper)" />
          <span className="font-[family-name:var(--font-grotesk)] font-bold tracking-[-0.03em]">
            Tap
          </span>
        </Link>
        <form action={logout}>
          <button
            type="submit"
            aria-label="Se deconnecter"
            className="flex size-9 items-center justify-center rounded-lg text-[var(--muted)]"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      </header>

      <main className="px-4 pb-28 pt-6 sm:px-6 lg:ml-60 lg:px-10 lg:pb-14 lg:pt-10">
        {/* L espace client lit du texte et des formulaires : une colonne
            etroite. L administration lit des tableaux : il lui faut la largeur. */}
        <div className={cn("mx-auto w-full", space === "admin" ? "max-w-6xl" : "max-w-4xl")}>
          {children}
        </div>
      </main>

      {/* Onglets - petits ecrans. Cinq maximum : au-dela, la cible devient
          trop etroite pour un pouce. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[var(--border)] bg-[var(--background)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {nav.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item) ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.62rem]",
              isActive(item) ? "text-[var(--brand-copper-deep)]" : "text-[var(--muted)]",
            )}
          >
            <span className="relative flex h-[1.15rem] items-center">
              <item.icon className="size-[1.15rem]" />
              <LinkSpinner className="absolute -right-3.5 top-0" />
            </span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
