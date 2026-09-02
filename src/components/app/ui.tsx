import Link from "next/link";
import { cn } from "@/lib/utils";
import { CountUp, Sparkline } from "@/components/app/figures";

/**
 * Primitives des espaces client et administrateur.
 *
 * Un seul jeu de surfaces, d en-tetes et de tuiles pour les deux espaces : ce
 * qui evite qu ils divergent page apres page, comme c etait le cas quand chaque
 * ecran redefinissait ses propres bordures et ses propres marges.
 *
 * La composition d une page est toujours la meme :
 *
 *   <PageHeader …/>   bande d encre, pleine largeur : identite, chiffres, action
 *   <PageBody>…</>    papier chaud, largeur de lecture : le travail lui-meme
 *
 * Ce decoupage existe parce que l ancienne version posait un h1 seul en haut
 * d un gris vide : le premier ecran ne disait ni ou l on etait, ni ce qui
 * comptait, ni quoi faire. La bande porte desormais ces trois reponses.
 */

// ---------------------------------------------------------------------------
// Ossature de page
// ---------------------------------------------------------------------------

const BAND_COLS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

export type BandStat = {
  label: string;
  value: number;
  hint?: string;
  /** Courbe tracee derriere le chiffre : la tendance, sans second bloc. */
  trend?: number[];
  tone?: "copper" | "plain";
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  stats,
  aside,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  stats?: BandStat[];
  /**
   * Colonne de droite, DANS la bande, autorisee a deborder vers le bas.
   *
   * Sans elle, un element pose par-dessus la bande recouvrait la rangee
   * d indicateurs : le chiffre le plus a droite disparaissait derriere lui.
   * Ici, la rangee s arrete d elle-meme avant la colonne.
   */
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="console-band">
      <div className="console-veil" aria-hidden>
        <div className="console-glow" />
        <div className="grain" />
        {/* Les ondes du sans-contact : la signature de la marque, reprise telle
            quelle plutot que d inventer un ornement propre a la console. */}
        <div className="ripple-arc absolute -right-24 -top-28 size-[26rem] opacity-[0.13]" />
      </div>

      <div
        className={cn(
          "relative mx-auto w-full max-w-[var(--console-measure,72rem)] px-4 pb-7 pt-8 sm:px-6 lg:px-10 lg:pb-9 lg:pt-12",
          aside && "lg:grid lg:grid-cols-[1fr_auto] lg:items-start lg:gap-10",
        )}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
            <div className="console-enter min-w-0 max-w-2xl">
              {eyebrow && (
                <p className="eyebrow text-[var(--brand-copper)]">{eyebrow}</p>
              )}
              <h1 className="console-figure mt-3 text-[clamp(1.9rem,1.3rem+2.2vw,2.9rem)] text-[var(--console-on-band)]">
                {title}
              </h1>
              {description && (
                <p className="mt-3 text-[0.92rem] leading-relaxed text-[var(--console-on-band-dim)]">
                  {description}
                </p>
              )}
            </div>
            {action && (
              <div className="console-enter [animation-delay:120ms]">{action}</div>
            )}
          </div>

          {stats && stats.length > 0 && (
            <dl
              className={cn(
                // Les filets sont portes par les cases elles-memes, et le fond
                // du cadre est celui des cases. Avec la technique inverse - un
                // fond clair vu au travers d un ecart d un pixel - toute case
                // manquante en fin de rangee apparaissait comme un bloc gris :
                // visible des qu il y avait cinq indicateurs sur deux colonnes.
                "console-enter mt-8 grid grid-cols-2 overflow-hidden rounded-2xl bg-[var(--console-band-soft)] sm:grid-cols-3 [animation-delay:180ms]",
                // Classes ecrites en toutes lettres : Tailwind ne voit pas les
                // noms construits a l execution.
                BAND_COLS[Math.min(stats.length, 5)] ?? "lg:grid-cols-5",
              )}
            >
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="relative overflow-hidden border-b border-r border-[var(--console-hair)] px-4 py-4 last:border-r-0"
                >
                  {s.trend && s.trend.length > 1 && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 opacity-45">
                      <Sparkline
                        points={s.trend}
                        stroke="var(--brand-copper)"
                        fill="rgb(217 142 90 / 0.14)"
                      />
                    </div>
                  )}
                  <dt className="relative text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[var(--console-on-band-dim)]">
                    {s.label}
                  </dt>
                  <dd
                    className={cn(
                      "console-figure relative mt-2 text-[2rem]",
                      s.tone === "plain"
                        ? "text-[var(--console-on-band)]"
                        : "text-[var(--brand-copper)]",
                    )}
                  >
                    <CountUp value={s.value} />
                  </dd>
                  {/* Une courbe occupe deja le bas de la case : y superposer une
                      legende rendait les deux illisibles. */}
                  {s.hint && !s.trend && (
                    <p className="relative mt-1 text-[0.7rem] text-[var(--console-on-band-dim)]">
                      {s.hint}
                    </p>
                  )}
                </div>
              ))}
            </dl>
          )}

          {children}
        </div>

        {aside && (
          <div className="console-enter relative z-10 hidden lg:block [animation-delay:240ms]">
            {aside}
          </div>
        )}
      </div>
    </header>
  );
}

/** Zone de travail : papier chaud, largeur de lecture, sous la bande. */
export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[var(--console-measure,72rem)] px-4 py-7 sm:px-6 lg:px-10 lg:py-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Surface({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--console-hairline)] bg-[var(--console-card)] shadow-[0_1px_2px_rgb(19_16_12/0.04),0_12px_28px_-20px_rgb(19_16_12/0.28)]",
        padded && "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="font-[family-name:var(--font-grotesk)] text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)]">
        {children}
      </h2>
      {hint && <span className="text-[0.72rem] text-[var(--muted)]">{hint}</span>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "neutral" | "accent";
}) {
  return (
    <div className="rounded-2xl border border-[var(--console-hairline)] bg-[var(--console-card)] p-4">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </p>
      <p
        className={cn(
          "console-figure mt-2 text-[1.9rem]",
          tone === "accent" ? "text-[var(--brand-copper-deep)]" : "text-[var(--foreground)]",
        )}
      >
        {typeof value === "number" ? <CountUp value={value} /> : value}
      </p>
      {hint && <p className="mt-1.5 text-[0.72rem] text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

/** Etat vide : une invitation a agir, jamais un simple constat de vide. */
export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--console-hairline)] bg-[var(--console-paper)] p-10 text-center">
      <h3 className="font-[family-name:var(--font-display)] text-[1.15rem] font-semibold">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-[0.87rem] leading-relaxed text-[var(--muted)]">
        {body}
      </p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="tap-target mx-auto mt-5 w-fit rounded-xl bg-[var(--brand-ink)] px-5 text-[0.87rem] font-semibold text-[var(--brand-paper)] transition-transform hover:-translate-y-0.5"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Etats
// ---------------------------------------------------------------------------

type Tone = "live" | "warn" | "stop" | "idle";

const TONE_CLASS: Record<Tone, string> = {
  live: "bg-[var(--state-live-bg)] text-[var(--state-live)]",
  warn: "bg-[var(--state-warn-bg)] text-[var(--state-warn)]",
  stop: "bg-[var(--state-stop-bg)] text-[var(--state-stop)]",
  idle: "bg-[var(--state-idle-bg)] text-[var(--state-idle)]",
};

export function Pill({
  children,
  tone = "idle",
  dot = false,
}: {
  children: React.ReactNode;
  tone?: Tone | "neutral";
  dot?: boolean;
}) {
  const t: Tone = tone === "neutral" ? "idle" : tone;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium",
        TONE_CLASS[t],
      )}
    >
      {(dot || t === "live") && (
        <span className="size-1.5 rounded-full bg-current" aria-hidden />
      )}
      {children}
    </span>
  );
}

/**
 * Etat d une carte ou d un compte.
 *
 * Les enums de la base (ACTIVE, UNASSIGNED, SUSPENDED…) etaient affiches tels
 * quels dans les tableaux : du vocabulaire de schema livre a l utilisateur, en
 * anglais, sans couleur. On traduit ici, en un seul endroit.
 */
const CARD_STATES: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Active", tone: "live" },
  UNASSIGNED: { label: "En stock", tone: "idle" },
  SUSPENDED: { label: "Suspendue", tone: "warn" },
  LOST: { label: "Perdue", tone: "stop" },
  REPLACED: { label: "Remplacee", tone: "idle" },
};

// Une carte est "active", un compte est "actif" : deux genres, deux tables.
const ACCOUNT_STATES: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Actif", tone: "live" },
  INVITED: { label: "Invite", tone: "warn" },
  SUSPENDED: { label: "Suspendu", tone: "warn" },
  DISABLED: { label: "Desactive", tone: "stop" },
  PENDING: { label: "En attente", tone: "warn" },
};

export function StatusBadge({
  status,
  kind = "card",
}: {
  status: string;
  kind?: "card" | "account";
}) {
  const table = kind === "account" ? ACCOUNT_STATES : CARD_STATES;
  const s = table[status] ?? { label: status, tone: "idle" as Tone };
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

// ---------------------------------------------------------------------------
// Tableaux
// ---------------------------------------------------------------------------

/**
 * Coque de tableau.
 *
 * Les tableaux d administration debordaient de la page sur petit ecran. Le
 * defilement est confine ici, une bonne fois, plutot que laisse au hasard de
 * chaque page.
 */
export function DataTable({
  head,
  children,
  caption,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  caption?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--console-hairline)] bg-[var(--console-card)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left text-[0.86rem]">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-[var(--console-hairline)] bg-[var(--console-paper)]">
              {head}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--console-hairline)]">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}

/** Jeton de carte : c est un code, il doit se lire comme un code. */
export function Token({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-[var(--console-paper)] px-2 py-1 font-[family-name:var(--font-mono)] text-[0.8rem] font-medium tracking-[0.06em]">
      {children}
    </span>
  );
}
