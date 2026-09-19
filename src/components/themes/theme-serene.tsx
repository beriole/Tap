import { ArrowUpRight, UserRoundPlus } from "lucide-react";
import { Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { buildCardModel } from "./premium/model";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * SERENE - Soft · Calm · Warm.
 *
 * Le parti pris : une page qui accueille avant de presenter, composee comme
 * la premiere page d un carnet. Le portrait est pose dans une arche - la
 * forme d une fenetre, pas celle d un avatar - doublee d un filet qui la
 * cerne a distance. Le nom est compose dans une serif aux terminaisons
 * adoucies, le nom de famille en italique ; la maison est annoncee en
 * petites capitales, la fonction en italique.
 *
 * Rien n est enferme dans une pastille : les gestes sont des mots poses sur
 * une portee de filets, les liens une table des matieres numerotee, les
 * reseaux une ligne de texte. Un seul halo de couleur rechauffe le haut de
 * la page ; rien ne bouge, rien ne clignote.
 *
 * Police : la serif Fraunces deja chargee par la plateforme, avec ses axes
 * SOFT et WONK. Aucun octet de police supplementaire au scan.
 */
const SOFT = { fontVariationSettings: '"SOFT" 100, "WONK" 0' } as React.CSSProperties;
const SERIF = "font-[family-name:var(--font-display)]";
const CAPS = "text-[11.5px] font-medium uppercase tracking-[0.22em]";

export function ThemeSerene({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "serene");
  const { identity, location } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;

  return (
    <main
      style={m.style}
      className="relative min-h-dvh overflow-x-clip bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased"
    >
      {/* Un seul halo, immobile, derriere l arche : la lumiere d une fenetre. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-140px] size-[520px] -translate-x-1/2 rounded-full opacity-40 blur-[90px]"
        style={{ background: "color-mix(in srgb, var(--pc-accent) 70%, white)" }}
      />

      <div className="relative mx-auto w-full max-w-[440px] px-7 pb-12 pt-[max(10px,env(safe-area-inset-top))] md:pt-10">
        <header className="pc-fade flex h-12 items-center justify-between" style={{ "--d": "0ms" } as React.CSSProperties}>
          <span aria-hidden className={cn(SERIF, "text-[17px] italic text-[var(--pc-ink-2)]")} style={SOFT}>
            {m.name.initials}
          </span>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            className="-mr-2.5 size-11 rounded-full text-[var(--pc-ink-2)] hover:bg-[var(--pc-press)]"
          />
        </header>

        {/* ------------------------------------------------------- L arche */}
        <section className="mt-3 flex flex-col items-center text-center">
          <div className="pc-lift relative h-[272px] w-[204px]" style={{ "--d": "40ms" } as React.CSSProperties}>
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-x-[11px] -bottom-[11px] -top-[11px] rounded-b-[6px] rounded-t-full border border-[var(--pc-line)]"
            />
            <div className="pc-unveil absolute inset-0 overflow-hidden rounded-b-[2px] rounded-t-full bg-[var(--pc-surface)]" style={{ "--d": "80ms" } as React.CSSProperties}>
              <Portrait
                src={identity.avatarUrl}
                alt={identity.displayName}
                sizes="204px"
                position={m.photoPosition}
                className="size-full"
                fallback={
                  <div
                    className="flex size-full items-center justify-center font-[family-name:var(--font-display)] text-[64px] italic text-[var(--pc-ink-2)]"
                    style={{ ...SOFT, background: "color-mix(in srgb, var(--pc-accent) 22%, var(--pc-bg))" }}
                  >
                    {m.name.initials}
                  </div>
                }
              />
            </div>
          </div>

          {identity.company && (
            <p className={cn(CAPS, "pc-rise mt-10 text-[var(--pc-ink-2)]")} style={{ "--d": "140ms" } as React.CSSProperties}>
              {identity.company}
            </p>
          )}
          <Name
            className={cn(
              SERIF,
              "pc-rise text-[clamp(38px,11.5vw,46px)] font-light leading-[1] tracking-[-0.025em] [text-wrap:balance]",
              identity.company ? "mt-3" : "mt-10",
            )}
            style={{ ...SOFT, "--d": "180ms" } as React.CSSProperties}
          >
            {m.name.first} {m.name.last && <em className="italic">{m.name.last}</em>}
          </Name>
          {identity.title && (
            <p
              className={cn(SERIF, "pc-rise mt-3 text-[17px] italic leading-snug text-[var(--pc-ink-2)] [text-wrap:balance]")}
              style={{ ...SOFT, "--d": "220ms" } as React.CSSProperties}
            >
              {identity.title}
            </p>
          )}
          {m.availability && (
            <p
              className="pc-rise mt-4 inline-flex items-center gap-2 text-[13.5px] text-[var(--pc-ink-2)]"
              style={{ "--d": "250ms" } as React.CSSProperties}
            >
              <span aria-hidden className="size-[5px] rounded-full bg-[var(--pc-cta)]" />
              {m.availability}
            </p>
          )}
        </section>

        {/* ------------------------------------------------------- Gestes */}
        <div className="pc-rise mt-9" style={{ "--d": "300ms" } as React.CSSProperties}>
          <SaveContact
            token={profile.cardToken}
            profileId={profile.id}
            name={identity.displayName}
            preview={preview}
            icon={<UserRoundPlus className="size-[17px]" strokeWidth={1.7} />}
            className="h-[54px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] text-[15px] font-medium tracking-[0.005em] text-[var(--pc-cta-ink)]"
          />
        </div>

        {m.actions.length > 0 && (
          <nav
            aria-label="Contacter"
            className="pc-rise mt-3 flex border-y border-[var(--pc-line)]"
            style={{ "--d": "340ms" } as React.CSSProperties}
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
                  SERIF,
                  "flex h-[52px] flex-1 items-center justify-center text-[16.5px] italic text-[var(--pc-ink)] hover:bg-[var(--pc-press)]",
                  i > 0 && "border-l border-[var(--pc-line)]",
                )}
                style={SOFT}
              >
                {a.label}
              </TrackedLink>
            ))}
          </nav>
        )}

        {/* ------------------------------------------------------- Mot */}
        {intro && (
          <figure className="pc-inview mx-auto mt-16 max-w-[31ch] text-center">
            <span aria-hidden className={cn(SERIF, "block text-[44px] leading-[0.5] text-[var(--pc-accent)]")} style={SOFT}>
              &ldquo;
            </span>
            <blockquote
              className={cn(SERIF, "mt-4 text-[21px] font-light leading-[1.45] tracking-[-0.01em] [text-wrap:pretty]")}
              style={SOFT}
            >
              {intro}
            </blockquote>
          </figure>
        )}

        {/* ------------------------------------------------------- Sommaire */}
        {m.destinations.length > 0 && (
          <section className="mt-16">
            <Rubric>À découvrir</Rubric>
            <ol className="mt-4">
              {m.destinations.map((link, i) => (
                <li key={link.id} className="pc-inview border-b border-[var(--pc-line)]">
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id.startsWith("profile-") ? null : link.id}
                    preview={preview}
                    external={link.external}
                    className="group flex min-h-[76px] items-baseline gap-4 py-4"
                  >
                    <span aria-hidden className={cn(SERIF, "w-8 shrink-0 text-[15px] italic text-[var(--pc-ink-2)]")} style={SOFT}>
                      {toRoman(i + 1)}.
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn(SERIF, "block text-[22px] leading-[1.15] tracking-[-0.01em]")} style={SOFT}>
                        {link.label}
                      </span>
                      {link.detail && (
                        <span className="mt-1 block truncate text-[13.5px] text-[var(--pc-ink-2)]">{link.detail}</span>
                      )}
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="size-[17px] shrink-0 self-center text-[var(--pc-ink-2)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      strokeWidth={1.5}
                    />
                  </TrackedLink>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ------------------------------------------------------- Reseaux */}
        {m.social.length > 0 && (
          <nav aria-label="Réseaux" className="pc-inview mt-12 text-center">
            <Rubric>Me suivre</Rubric>
            <ul className="mt-3 flex flex-wrap items-center justify-center">
              {m.social.map((link, i) => (
                <li key={link.id} className="flex items-center">
                  {i > 0 && (
                    <span aria-hidden className="text-[var(--pc-accent)]">
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
                    className={cn(
                      SERIF,
                      "inline-flex h-11 items-center px-3.5 text-[18px] underline decoration-[var(--pc-line)] decoration-1 underline-offset-[6px] hover:decoration-[var(--pc-ink-2)]",
                    )}
                    style={SOFT}
                  >
                    {link.label}
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* ------------------------------------------------------- Lieu */}
        {m.place && m.mapHref && (
          <section className="pc-inview mt-12 text-center">
            <Rubric>Me rencontrer</Rubric>
            <p className={cn(SERIF, "mt-4 text-[21px] leading-snug [text-wrap:balance]")} style={SOFT}>
              {m.place}
            </p>
            {location.country && <p className="mt-1 text-[14px] text-[var(--pc-ink-2)]">{location.country}</p>}
            <TrackedLink
              href={m.mapHref}
              profileId={profile.id}
              action="DIRECTIONS"
              preview={preview}
              external
              className="mt-2 inline-flex h-11 items-center gap-1.5 px-2 text-[14px] font-medium underline decoration-[var(--pc-accent)] decoration-1 underline-offset-[6px]"
            >
              Itinéraire
              <ArrowUpRight aria-hidden className="size-[15px]" strokeWidth={1.6} />
            </TrackedLink>
          </section>
        )}

        <footer className="mt-16 flex flex-col items-center gap-1 border-t border-[var(--pc-line)] pt-6">
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            showLabel
            label="Partager ce profil"
            className="h-11 rounded-full px-4 text-[14px] text-[var(--pc-ink)] hover:bg-[var(--pc-press)]"
          />
          <p className="text-[12px] text-[var(--pc-ink-2)]">Carte NFC · Tap</p>
        </footer>
      </div>
    </main>
  );
}

/** Intitule de rubrique : petites capitales entre deux filets courts. */
function Rubric({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center justify-center gap-3 text-[11.5px] font-medium uppercase tracking-[0.22em] text-[var(--pc-ink-2)]">
      <span aria-hidden className="h-px w-6 bg-[var(--pc-accent)]" />
      {children}
      <span aria-hidden className="h-px w-6 bg-[var(--pc-accent)]" />
    </h2>
  );
}

function toRoman(n: number): string {
  const table: [number, string][] = [
    [10, "x"],
    [9, "ix"],
    [5, "v"],
    [4, "iv"],
    [1, "i"],
  ];
  let out = "";
  for (const [v, s] of table) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}
