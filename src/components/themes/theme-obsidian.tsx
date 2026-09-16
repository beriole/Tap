import { ArrowUpRight, MapPin, Plus } from "lucide-react";
import { Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { obsidianDisplay } from "./premium/font-obsidian";
import { buildCardModel } from "./premium/model";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * OBSIDIAN - Luxury · Executive · Exclusive.
 *
 * Le parti pris : une invitation privee, pas une vitrine. Le portrait est
 * tire comme une epreuve sous passe-partout - un cadre d un pixel detache de
 * l image, marque a ses angles. Le nom est compose en serif editoriale, seule
 * voix expressive de la page ; tout le reste est en capitales fines ou en
 * texte courant, tres aere.
 *
 * L or : cinq a dix pour cent de la surface, jamais plus. Il ne sert qu a
 * signaler - les angles du cadre, le trait sous l identite, les icones
 * d action, la fleche d un lien touche. Le bouton principal est ivoire sur
 * noir, pas dore : le luxe tient au contraste, pas au metal.
 *
 * Rien ne bouge en continu. Les entrees sont plus lentes que dans Signature
 * (450 ms, deplacements de quelques pixels) : l elegance est dans la retenue.
 */
export function ThemeObsidian({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "obsidian");
  const { identity } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;

  return (
    <main
      style={m.style}
      className={cn(
        obsidianDisplay.variable,
        "min-h-dvh bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased",
      )}
    >
      {/* Un seul eclairage, tres bas, au-dessus du portrait : sans lui le noir
          parait plat, avec plus il devient un effet. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[70svh] opacity-70"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 18%, color-mix(in srgb, var(--pc-ink) 7%, transparent), transparent 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[440px] px-6 pb-14 pt-[max(14px,env(safe-area-inset-top))] md:pt-12">
        <header
          className="pc-fade flex h-12 items-center justify-between"
          style={{ "--d": "0ms" } as React.CSSProperties}
        >
          <span className="truncate text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--pc-ink-2)]">
            {identity.company ?? " "}
          </span>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            className="-mr-2 size-10 rounded-full text-[var(--pc-ink-2)] hover:bg-[var(--pc-press)]"
          />
        </header>

        {/* Le tirage : passe-partout d un pixel, angles marques. */}
        <section className="mt-5 flex justify-center">
          <div className="relative w-[70%] max-w-[292px]">
            <div
              aria-hidden
              className="pc-fade pointer-events-none absolute -inset-[11px] border border-[var(--pc-line)]"
              style={{ "--d": "140ms" } as React.CSSProperties}
            />
            <CornerMarks />
            <div className="pc-fade relative aspect-[4/5] overflow-hidden bg-[var(--pc-surface)]">
              <div className="pc-settle absolute inset-0">
                <Portrait
                  src={identity.avatarUrl}
                  alt={identity.displayName}
                  sizes="(max-width: 440px) 70vw, 292px"
                  position={m.photoPosition}
                  className="size-full"
                  fallback={
                    <div className="flex size-full items-center justify-center font-[family-name:var(--pc-display)] text-[72px] italic text-[var(--pc-ink-2)]">
                      {m.name.initials}
                    </div>
                  }
                />
              </div>
              {/* Le bas du tirage se fond dans le noir : l image n est pas
                  collee sur la page, elle en sort. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
                style={{
                  background: "linear-gradient(to top, color-mix(in srgb, var(--pc-bg) 55%, transparent), transparent)",
                }}
              />
            </div>
          </div>
        </section>

        <section className="mt-10 text-center">
          <Name
            className="pc-rise font-[family-name:var(--pc-display)] text-[clamp(34px,10vw,40px)] font-normal leading-[1] tracking-[-0.012em]"
            style={{ "--d": "200ms" } as React.CSSProperties}
          >
            {m.name.full}
          </Name>

          {m.role.length > 0 && (
            <p
              className="pc-rise mt-3 text-[15px] leading-[1.5] text-[var(--pc-ink-2)]"
              style={{ "--d": "250ms" } as React.CSSProperties}
            >
              {identity.title}
              {identity.title && identity.company && (
                <span aria-hidden className="mx-2 text-[var(--pc-accent)]">
                  ·
                </span>
              )}
              {identity.company}
            </p>
          )}

          <div
            aria-hidden
            className="pc-draw mx-auto mt-6 h-px w-10 bg-[var(--pc-accent)]"
            style={{ "--d": "320ms", transformOrigin: "center" } as React.CSSProperties}
          />
        </section>

        <div className="pc-rise mt-7" style={{ "--d": "360ms" } as React.CSSProperties}>
          <SaveContact
            token={profile.cardToken}
            profileId={profile.id}
            name={identity.displayName}
            preview={preview}
            icon={<Plus className="size-[17px] text-[var(--pc-accent)]" strokeWidth={2} />}
            className="h-[52px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] text-[14.5px] font-medium tracking-[0.02em] text-[var(--pc-cta-ink)]"
          />
        </div>

        {m.actions.length > 0 && (
          <nav
            aria-label="Contacter"
            className="pc-rise mt-2.5 grid gap-2.5"
            style={
              {
                "--d": "400ms",
                gridTemplateColumns: `repeat(${m.actions.length}, minmax(0, 1fr))`,
              } as React.CSSProperties
            }
          >
            {m.actions.map((a) => (
              <TrackedLink
                key={a.kind}
                href={a.href}
                profileId={profile.id}
                action={a.action}
                linkId={a.linkId}
                preview={preview}
                external={a.external}
                className="flex h-[48px] items-center justify-center gap-2 rounded-[var(--pc-radius)] border border-[var(--pc-line)] text-[13.5px] text-[var(--pc-ink)] hover:border-[color-mix(in_srgb,var(--pc-accent)_45%,transparent)]"
              >
                <ActionIcon kind={a.kind} className="size-[16px] text-[var(--pc-accent)]" strokeWidth={1.6} />
                {a.label}
              </TrackedLink>
            ))}
          </nav>
        )}

        {intro && (
          <p className="pc-inview mx-auto mt-12 max-w-[34ch] text-center text-[15px] leading-[1.75] text-[var(--pc-ink-2)]">
            {intro}
          </p>
        )}

        {m.destinations.length > 0 && (
          <section className="mt-12">
            <Rule>Sélection</Rule>
            <ul className="mt-1">
              {m.destinations.map((link) => (
                <li key={link.id} className="pc-inview border-b border-[var(--pc-line)]">
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id.startsWith("profile-") ? null : link.id}
                    preview={preview}
                    external={link.external}
                    className="group flex items-end justify-between gap-4 py-[18px]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-[family-name:var(--pc-display)] text-[22px] leading-[1.1]">
                        {link.label}
                      </span>
                      {link.detail && (
                        <span className="mt-1.5 block truncate text-[12px] uppercase tracking-[0.16em] text-[var(--pc-ink-2)]">
                          {link.detail}
                        </span>
                      )}
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="mb-1 size-[16px] shrink-0 text-[var(--pc-ink-3)] transition-colors duration-200 group-hover:text-[var(--pc-accent)] group-active:text-[var(--pc-accent)]"
                      strokeWidth={1.5}
                    />
                    {/* Le filet d or qui court sous la ligne touchee. */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-[var(--pc-accent)] transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 group-active:scale-x-100"
                    />
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </section>
        )}

        {m.social.length > 0 && (
          <nav aria-label="Réseaux" className="pc-inview mt-10 flex flex-wrap items-center justify-center gap-x-1 gap-y-2">
            {m.social.map((link, i) => (
              <span key={link.id} className="flex items-center">
                {i > 0 && (
                  <span aria-hidden className="px-2 text-[var(--pc-accent)]">
                    ·
                  </span>
                )}
                <TrackedLink
                  href={link.href}
                  profileId={profile.id}
                  action="LINK"
                  linkId={link.id}
                  preview={preview}
                  external={link.external}
                  className="rounded-[3px] px-1.5 py-2 text-[12px] uppercase tracking-[0.18em] text-[var(--pc-ink-2)] hover:text-[var(--pc-ink)]"
                >
                  {link.label}
                </TrackedLink>
              </span>
            ))}
          </nav>
        )}

        {m.place && m.mapHref && (
          <section className="pc-inview mt-11 text-center">
            <TrackedLink
              href={m.mapHref}
              profileId={profile.id}
              action="DIRECTIONS"
              preview={preview}
              external
              className="group inline-flex flex-col items-center rounded-[3px] px-4 py-2"
            >
              <MapPin aria-hidden className="size-[16px] text-[var(--pc-accent)]" strokeWidth={1.6} />
              <span className="mt-2.5 text-[15px]">{m.place}</span>
              {profile.location.country && (
                <span className="mt-1 text-[12px] uppercase tracking-[0.18em] text-[var(--pc-ink-2)]">
                  {profile.location.country}
                </span>
              )}
              <span className="mt-3 border-b border-[var(--pc-line)] pb-0.5 text-[13px] text-[var(--pc-ink-2)] transition-colors group-hover:border-[var(--pc-accent)] group-hover:text-[var(--pc-ink)]">
                Itinéraire
              </span>
            </TrackedLink>
          </section>
        )}

        <footer className="mt-14 flex flex-col items-center gap-5">
          <Rule />
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            showLabel
            label="Partager"
            className="h-11 rounded-[var(--pc-radius)] px-5 text-[12px] uppercase tracking-[0.22em] text-[var(--pc-ink-2)] hover:text-[var(--pc-ink)]"
          />
        </footer>
      </div>
    </main>
  );
}

/** Filet horizontal, avec etiquette facultative en capitales espacees. */
function Rule({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex w-full items-center gap-4">
      {children && (
        <h2 className="shrink-0 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--pc-ink-2)]">
          {children}
        </h2>
      )}
      <span aria-hidden className="h-px flex-1 bg-[var(--pc-line)]" />
    </div>
  );
}

/**
 * Les quatre angles du passe-partout, en accent. Dix pixels de trait : assez
 * pour signaler le cadre, trop peu pour le decorer.
 */
function CornerMarks() {
  const corner = "absolute size-[10px] border-[var(--pc-accent)]";
  const style = { "--d": "260ms" } as React.CSSProperties;
  return (
    <div aria-hidden className="pc-fade pointer-events-none absolute -inset-[11px]" style={style}>
      <span className={cn(corner, "left-0 top-0 border-l border-t")} />
      <span className={cn(corner, "right-0 top-0 border-r border-t")} />
      <span className={cn(corner, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(corner, "bottom-0 right-0 border-b border-r")} />
    </div>
  );
}
