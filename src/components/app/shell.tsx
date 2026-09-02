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

  /**
   * Passerelle entre les deux espaces.
   *
   * Un administrateur possede lui aussi une carte : il a donc besoin des deux
   * cotes. Sans ce lien, arrive dans l un il n avait aucun moyen d apprendre
   * que l autre existait - le back-office etait invisible depuis l interieur
   * du produit.
   */
  const isStaff = user.role === "ADMIN" || user.role === "SUPERADMIN";
  const crossSpace: NavItem =
    space === "admin"
      ? { href: "/dashboard", label: "Mon espace client", icon: User }
      : { href: "/admin", label: "Administration", icon: Shield };

  return (
    <div className="min-h-dvh bg-[var(--console-paper)]">
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
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.88rem] transition-colors duration-200",
                isActive(item)
                  ? "bg-white/[0.07] font-medium text-[var(--brand-paper)]"
                  : "text-white/40 hover:bg-white/[0.04] hover:text-white/80",
              )}
            >
              {/* Repere cuivre de la page courante : une barre qui grandit
                  depuis le centre, plutot qu un aplat qui apparait sec. */}
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--brand-copper)] transition-all duration-300",
                  isActive(item) ? "h-5 opacity-100" : "h-0 opacity-0",
                )}
              />
              <item.icon
                className={cn(
                  "size-[1.05rem] shrink-0 transition-transform duration-200",
                  isActive(item)
                    ? "text-[var(--brand-copper)]"
                    : "group-hover:translate-x-0.5",
                )}
              />
              <span className="flex-1">{item.label}</span>
              <LinkSpinner />
            </Link>
          ))}
        </nav>

        {isStaff && (
          <Link
            href={crossSpace.href}
            className="mb-3 flex items-center gap-3 rounded-xl border border-[var(--brand-copper)]/30 bg-[var(--brand-copper)]/10 px-3 py-2.5 text-[0.82rem] text-[var(--brand-copper)] transition-colors hover:bg-[var(--brand-copper)]/20"
          >
            <crossSpace.icon className="size-[1.05rem] shrink-0" />
            <span className="flex-1">{crossSpace.label}</span>
            <LinkSpinner />
          </Link>
        )}

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

      {/* Barre superieure - petits ecrans.

          Elle est d encre, comme la bande de titre qui la suit immediatement :
          les deux ne forment ainsi qu une seule surface. En clair sur fond
          sombre, la couture se voyait a chaque page. */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-[var(--console-band)] px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2 text-[var(--brand-paper)]">
          <LogoMark className="h-5 text-[var(--brand-paper)]" lineColor="var(--brand-ink)" />
          <span className="font-[family-name:var(--font-grotesk)] font-bold tracking-[-0.03em]">
            Tap
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {isStaff && (
            <Link
              href={crossSpace.href}
              aria-label={crossSpace.label}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--brand-copper)]/35 bg-[var(--brand-copper)]/15 px-2.5 text-[0.72rem] font-medium text-[var(--brand-copper)]"
            >
              <crossSpace.icon className="size-3.5" />
              {space === "admin" ? "Ma carte" : "Admin"}
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              aria-label="Se deconnecter"
              className="flex size-9 items-center justify-center rounded-lg text-white/45 transition-colors hover:text-white/80"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </header>

      {/* La bande d en-tete de chaque page saigne sur toute la largeur : <main>
          ne pose donc aucune marge horizontale, ce sont PageHeader et PageBody
          qui gerent la leur.

          L espace client lit du texte et des formulaires : une colonne etroite.
          L administration lit des tableaux : il lui faut la largeur. La mesure
          est portee par une variable pour n etre decidee qu ici. */}
      <main
        className="pb-28 lg:ml-60 lg:pb-0"
        style={
          { "--console-measure": space === "admin" ? "72rem" : "58rem" } as React.CSSProperties
        }
      >
        {children}
      </main>

      {/* Onglets - petits ecrans. Cinq maximum : au-dela, la cible devient
          trop etroite pour un pouce. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[var(--console-hairline)] bg-[var(--console-card)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {nav.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item) ? "page" : undefined}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.62rem] transition-colors",
              isActive(item) ? "text-[var(--brand-copper-deep)]" : "text-[var(--muted)]",
            )}
          >
            {/* Le repere est en haut de l onglet : au pouce, le bas est masque
                par la main au moment meme ou l on cherche a se situer. */}
            <span
              aria-hidden
              className={cn(
                "absolute top-0 h-[2px] rounded-b-full bg-[var(--brand-copper)] transition-all duration-300",
                isActive(item) ? "w-8 opacity-100" : "w-0 opacity-0",
              )}
            />
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
