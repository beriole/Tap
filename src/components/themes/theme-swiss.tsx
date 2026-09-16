import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { swissDisplay } from "./premium/font-swiss";
import { buildCardModel } from "./premium/model";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * SWISS - Grid · Typographic · Precise.
 *
 * Le parti pris : une affiche de graphisme suisse. Le nom occupe la largeur
 * de l ecran, ferme par un point de couleur - le seul ornement de la page.
 * Tout le reste obeit a une grille en tiers : etiquettes en capitales mono
 * dans le premier tiers, valeurs dans les deux autres. La photo est en noir
 * et blanc, petite, alignee sur la grille comme une vignette de catalogue.
 *
 * Aucun arrondi, aucune ombre. La rigueur tient a l alignement.
 */
export function ThemeSwiss({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "swiss");
  const { identity, location } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;

  const facts = [
    ["Fonction", identity.title],
    ["Société", identity.company],
    ["Ville", [location.city, location.country].filter(Boolean).join(", ") || null],
  ].filter((f): f is [string, string] => Boolean(f[1]));

  return (
    <main
      style={m.style}
      className={cn(swissDisplay.variable, "min-h-dvh bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased")}
    >
      <div className="mx-auto w-full max-w-[460px] px-5 pb-14 pt-[max(12px,env(safe-area-inset-top))] md:pt-10">
        <header
          className="pc-fade flex h-12 items-center justify-between border-b border-[var(--pc-ink)]"
          style={{ "--d": "0ms" } as React.CSSProperties}
        >
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em]">
            Carte de visite
          </span>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            className="-mr-2 size-10 text-[var(--pc-ink)] hover:bg-[var(--pc-press)]"
          />
        </header>

        {/* Le nom-affiche : chaque ligne se devoile depuis sa propre ligne de base. */}
        <Name className="mt-6 font-[family-name:var(--pc-display)] text-[clamp(52px,16.5vw,76px)] font-semibold leading-[0.86] tracking-[-0.055em]">
          <span className="block overflow-hidden pb-[0.06em]">
            <span className="pc-rise block" style={{ "--d": "60ms" } as React.CSSProperties}>
              {m.name.first}
            </span>
          </span>
          {m.name.last && (
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="pc-rise block" style={{ "--d": "130ms" } as React.CSSProperties}>
                {m.name.last}
                <span aria-hidden className="text-[var(--pc-accent)]">
                  .
                </span>
              </span>
            </span>
          )}
        </Name>

        {/* Fiche : etiquettes au premier tiers, valeurs aux deux autres, vignette a droite. */}
        <section className="mt-7 grid grid-cols-[1fr_92px] gap-4">
          <dl className="pc-rise border-t border-[var(--pc-ink)]" style={{ "--d": "200ms" } as React.CSSProperties}>
            {facts.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[84px_1fr] gap-2 border-b border-[var(--pc-line)] py-2.5">
                <dt className="pt-[3px] font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.12em] text-[var(--pc-ink-2)]">
                  {label}
                </dt>
                <dd className="text-[15px] leading-snug">{value}</dd>
              </div>
            ))}
            {m.availability && (
              <div className="grid grid-cols-[84px_1fr] gap-2 py-2.5">
                <dt className="pt-[3px] font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.12em] text-[var(--pc-ink-2)]">
                  Statut
                </dt>
                <dd className="flex items-start gap-2 text-[15px] leading-snug">
                  <span aria-hidden className="mt-[7px] size-2 shrink-0 bg-[var(--pc-accent)]" />
                  {m.availability}
                </dd>
              </div>
            )}
          </dl>
          <div className="pc-unveil relative h-[116px] w-[92px] self-start overflow-hidden border-t border-[var(--pc-ink)] pt-0">
            <Portrait
              src={identity.avatarUrl}
              alt={identity.displayName}
              sizes="92px"
              position={m.photoPosition}
              className="size-full bg-[var(--pc-surface)]"
              imageClassName="grayscale contrast-[1.06]"
              fallback={
                <div className="flex size-full items-center justify-center bg-[var(--pc-surface)] font-[family-name:var(--pc-display)] text-[30px] font-semibold tracking-[-0.05em]">
                  {m.name.initials}
                </div>
              }
            />
          </div>
        </section>

        <div className="pc-rise mt-7" style={{ "--d": "280ms" } as React.CSSProperties}>
          <SaveContact
            token={profile.cardToken}
            profileId={profile.id}
            name={identity.displayName}
            preview={preview}
            icon={null}
            trailing={<ArrowRight aria-hidden className="size-5" strokeWidth={2} />}
            className="h-[56px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] px-5 text-[15.5px] font-semibold tracking-[-0.01em] text-[var(--pc-cta-ink)]"
          />
        </div>

        {m.actions.length > 0 && (
          <nav
            aria-label="Contacter"
            className="pc-rise grid border-b border-[var(--pc-ink)]"
            style={
              { "--d": "330ms", gridTemplateColumns: `repeat(${m.actions.length}, minmax(0, 1fr))` } as React.CSSProperties
            }
          >
            {m.actions.map((a, i) => (
              <TrackedLink
                key={a.kind}
                href={a.href}
                profileId={profile.id}
                action={a.action}
                linkId={a.linkId}
                preview={preview}
                external={a.external}
                className={cn(
                  "flex h-[58px] items-center justify-between px-3 text-[14px] font-medium",
                  i > 0 && "border-l border-[var(--pc-line)]",
                )}
              >
                {a.label}
                <ActionIcon kind={a.kind} className="size-[16px] text-[var(--pc-ink-2)]" />
              </TrackedLink>
            ))}
          </nav>
        )}

        {intro && (
          <section className="pc-inview mt-12 grid grid-cols-[84px_1fr] gap-2">
            <h2 className="pt-1 font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.12em] text-[var(--pc-ink-2)]">
              À propos
            </h2>
            <p className="text-[16px] leading-[1.5] tracking-[-0.005em]">{intro}</p>
          </section>
        )}

        {m.destinations.length > 0 && (
          <section className="mt-12">
            <h2 className="border-b border-[var(--pc-ink)] pb-2 font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.12em]">
              Index
            </h2>
            <ul>
              {m.destinations.map((link) => (
                <li key={link.id} className="pc-inview border-b border-[var(--pc-line)]">
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id.startsWith("profile-") ? null : link.id}
                    preview={preview}
                    external={link.external}
                    className="group grid grid-cols-[84px_1fr_auto] items-baseline gap-2 py-4"
                  >
                    <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.12em] text-[var(--pc-ink-2)]">
                      {link.kind}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-[family-name:var(--pc-display)] text-[20px] font-semibold leading-tight tracking-[-0.03em]">
                        {link.label}
                      </span>
                      {link.description && (
                        <span className="mt-1 block truncate text-[13px] text-[var(--pc-ink-2)]">{link.description}</span>
                      )}
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="size-4 translate-y-0.5 text-[var(--pc-ink)] transition-transform duration-200 group-hover:-translate-y-0 group-hover:translate-x-0.5"
                    />
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </section>
        )}

        {m.social.length > 0 && (
          <section className="pc-inview mt-10 grid grid-cols-[84px_1fr] gap-2">
            <h2 className="pt-1 font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.12em] text-[var(--pc-ink-2)]">
              Réseaux
            </h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {m.social.map((link) => (
                <li key={link.id}>
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id}
                    preview={preview}
                    external={link.external}
                    className="inline-flex items-center gap-1 py-1 text-[15px] font-medium underline decoration-[var(--pc-line)] underline-offset-4 hover:decoration-[var(--pc-accent)]"
                  >
                    {link.label}
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </section>
        )}

        {m.place && m.mapHref && (
          <section className="pc-inview mt-10 grid grid-cols-[84px_1fr] gap-2 border-t border-[var(--pc-ink)] pt-4">
            <h2 className="pt-1 font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.12em] text-[var(--pc-ink-2)]">
              Adresse
            </h2>
            <TrackedLink
              href={m.mapHref}
              profileId={profile.id}
              action="DIRECTIONS"
              preview={preview}
              external
              className="group block"
            >
              <span className="block text-[16px] leading-snug">{m.place}</span>
              {location.country && <span className="block text-[14px] text-[var(--pc-ink-2)]">{location.country}</span>}
              <span className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold">
                Itinéraire
                <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </TrackedLink>
          </section>
        )}

        <footer className="mt-14 flex items-center justify-between border-t border-[var(--pc-ink)] pt-3 font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.12em] text-[var(--pc-ink-2)]">
          <span>Carte NFC</span>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            showLabel
            label="Partager"
            className="h-9 gap-1.5 uppercase text-[var(--pc-ink)]"
          />
        </footer>
      </div>
    </main>
  );
}
