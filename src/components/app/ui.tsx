import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Primitives des espaces client et administrateur.
 *
 * Un seul jeu de surfaces, d en-tetes et de tuiles pour les deux espaces : ce
 * qui evite qu ils divergent page apres page, comme c etait le cas quand chaque
 * ecran redefinissait ses propres bordures et ses propres marges.
 */

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
        "rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]",
        padded && "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow text-[var(--muted)]">{eyebrow}</p>}
        <h1 className="mt-2 font-[family-name:var(--font-grotesk)] text-[1.6rem] font-bold leading-[1.1] tracking-[-0.03em]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-xl text-[0.9rem] leading-relaxed text-[var(--muted)]">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-[0.82rem] font-semibold tracking-[-0.01em] text-[var(--foreground)]">
      {children}
    </h2>
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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow-soft)]">
      <p className="text-[0.72rem] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-[family-name:var(--font-grotesk)] text-[1.85rem] font-bold leading-none tracking-[-0.03em] tabular-nums",
          tone === "accent" && "text-[var(--brand-copper-deep)]",
        )}
      >
        {value}
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
    <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
      <h3 className="text-[1rem] font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-[0.87rem] leading-relaxed text-[var(--muted)]">
        {body}
      </p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="tap-target mx-auto mt-5 w-fit rounded-xl bg-[var(--brand-ink)] px-5 text-[0.87rem] font-semibold text-[var(--brand-paper)]"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "live" | "warn";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium",
        tone === "neutral" && "bg-[var(--surface)] text-[var(--muted)]",
        tone === "live" && "bg-emerald-50 text-emerald-700",
        tone === "warn" && "bg-amber-50 text-amber-700",
      )}
    >
      {tone === "live" && <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />}
      {children}
    </span>
  );
}
