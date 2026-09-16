import { ArrowUpRight, MapPin } from "lucide-react";
import { Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { journalDisplay } from "./premium/font-journal";
import { buildCardModel } from "./premium/model";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * JOURNAL - Editorial · Narrative · Literary.
 *
 * Le parti pris : la une d un magazine consacre a une seule personne. Le nom
 * en manchette sous un double filet, le portrait en photo d ouverture avec sa
 * legende en italique, puis la presentation ouverte par une lettrine. Les
 * liens forment un sommaire a points de conduite.
 *
 * Ce qui en fait un portrait et non un pastiche : aucune fausse date, aucun
 * faux numero. Chaque element typographique porte une vraie information du
 * profil.
 */
export function ThemeJournal({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "journal");
  const { identity, location } = profile;
  const Name = preview ? "p" : "h1";
  const bio = identity.bio;
  const quote = identity.tagline;

  return (
    <main
      style={m.style}
      className={cn(journalDisplay.variable, "min-h-dvh bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased")}
    >
      <div className="mx-auto w-full max-w-[460px] px-5 pb-14 pt-[max(12px,env(safe-area-inset-top))] md:pt-10">
        <header className="pc-fade flex h-11 items-center justify-between" style={{ "--d": "0ms" } as React.CSSProperties}>
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--pc-ink-2)]">
            {m.region ?? "Portrait"}
          </span>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            className="-mr-2 size-10 text-[var(--pc-ink-2)] hover:bg-[var(--pc-press)]"
          />
        </header>

        {/* Manchette */}
        <div className="pc-draw h-[3px] bg-[var(--pc-ink)]" style={{ "--d": "40ms" } as React.CSSProperties} />
        <div className="pc-draw mt-[3px] h-px bg-[var(--pc-ink)]" style={{ "--d": "90ms" } as React.CSSProperties} />
        <section className="py-4 text-center">
          {identity.title && (
            <p
              className="pc-rise text-[11.5px] font-medium uppercase tracking-[0.22em] text-[var(--pc-accent)]"
              style={{ "--d": "120ms" } as React.CSSProperties}
            >
              {identity.title}
            </p>
          )}
          <Name
            className="pc-rise mt-2 font-[family-name:var(--pc-display)] text-[clamp(38px,11.5vw,50px)] font-medium leading-[0.98] tracking-[-0.025em]"
            style={{ "--d": "170ms" } as React.CSSProperties}
          >
            {m.name.full}
          </Name>
        </section>
        <div className="h-px bg-[var(--pc-ink)]" />

        {/* Photo d ouverture et legende */}
        <figure className="mt-4">
          <div className="pc-unveil relative aspect-[4/3] overflow-hidden" style={{ "--d": "120ms" } as React.CSSProperties}>
            <Portrait
              src={identity.avatarUrl}
              alt={identity.displayName}
              sizes="(max-width: 460px) 92vw, 420px"
              position={m.photoPosition}
              className="size-full bg-[var(--pc-surface)]"
              fallback={
                <div className="flex size-full items-center justify-center bg-[var(--pc-surface)] font-[family-name:var(--pc-display)] text-[96px] italic text-[var(--pc-ink-2)]">
                  {m.name.initials}
                </div>
              }
            />
          </div>
          <figcaption
            className="pc-fade mt-2 flex items-baseline justify-between gap-3 border-b border-[var(--pc-line)] pb-2"
            style={{ "--d": "260ms" } as React.CSSProperties}
          >
            <span className="font-[family-name:var(--pc-display)] text-[14.5px] italic leading-snug text-[var(--pc-ink-2)]">
              {identity.displayName}
              {identity.company ? `, ${identity.company}` : ""}.
            </span>
          </figcaption>
        </figure>

        <div className="pc-rise mt-5" style={{ "--d": "300ms" } as React.CSSProperties}>
          <SaveContact
            token={profile.cardToken}
            profileId={profile.id}
            name={identity.displayName}
            preview={preview}
            icon={null}
            className="h-[52px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] text-[14px] font-medium uppercase tracking-[0.14em] text-[var(--pc-cta-ink)]"
          />
        </div>

        {m.actions.length > 0 && (
          <nav
            aria-label="Contacter"
            className="pc-rise mt-3 flex items-stretch justify-center divide-x divide-[var(--pc-line)]"
            style={{ "--d": "340ms" } as React.CSSProperties}
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
                className="flex-1 py-3 text-center font-[family-name:var(--pc-display)] text-[17px] italic underline-offset-4 hover:underline"
              >
                {a.label}
              </TrackedLink>
            ))}
          </nav>
        )}

        {bio && (
          <p className="pc-inview mt-9 text-[16.5px] leading-[1.62] first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-[family-name:var(--pc-display)] first-letter:text-[62px] first-letter:font-medium first-letter:leading-[0.8] first-letter:text-[var(--pc-accent)]">
            {bio}
          </p>
        )}

        {quote && (
          <blockquote className="pc-inview relative mt-9 border-y border-[var(--pc-line)] px-2 py-6 text-center">
            <span aria-hidden className="block font-[family-name:var(--pc-display)] text-[48px] leading-[0.6] text-[var(--pc-accent)]">
              “
            </span>
            <p className="mt-2 font-[family-name:var(--pc-display)] text-[23px] italic leading-[1.3] tracking-[-0.01em]">
              {quote}
            </p>
          </blockquote>
        )}

        {m.destinations.length > 0 && (
          <section className="mt-10">
            <Rubric>Sommaire</Rubric>
            <ol className="mt-3">
              {m.destinations.map((link) => (
                <li key={link.id} className="pc-inview">
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id.startsWith("profile-") ? null : link.id}
                    preview={preview}
                    external={link.external}
                    className="group flex items-baseline gap-3 py-3"
                  >
                    <span className="font-[family-name:var(--pc-display)] text-[19px] leading-tight group-hover:italic">
                      {link.label}
                    </span>
                    {/* Points de conduite : ils relient le titre a sa rubrique. */}
                    <span aria-hidden className="mb-1 min-w-6 flex-1 border-b border-dotted border-[var(--pc-ink-3)]" />
                    <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--pc-ink-2)]">
                      {link.kind}
                    </span>
                  </TrackedLink>
                </li>
              ))}
            </ol>
          </section>
        )}

        {m.social.length > 0 && (
          <section className="pc-inview mt-10 text-center">
            <Rubric>Suivre</Rubric>
            <p className="mt-3 font-[family-name:var(--pc-display)] text-[18px] italic leading-relaxed">
              {m.social.map((link, i) => (
                <span key={link.id}>
                  {i > 0 && <span className="mx-2 text-[var(--pc-accent)] not-italic">·</span>}
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id}
                    preview={preview}
                    external={link.external}
                    className="underline decoration-[var(--pc-line)] underline-offset-4 hover:decoration-[var(--pc-accent)]"
                  >
                    {link.label}
                  </TrackedLink>
                </span>
              ))}
            </p>
          </section>
        )}

        {m.place && m.mapHref && (
          <section className="pc-inview mt-10 text-center">
            <Rubric>Où nous trouver</Rubric>
            <TrackedLink
              href={m.mapHref}
              profileId={profile.id}
              action="DIRECTIONS"
              preview={preview}
              external
              className="group mt-3 inline-flex flex-col items-center px-3 py-1"
            >
              <span className="font-[family-name:var(--pc-display)] text-[19px]">{m.place}</span>
              {location.country && <span className="text-[14px] text-[var(--pc-ink-2)]">{location.country}</span>}
              <span className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--pc-accent)]">
                <MapPin aria-hidden className="size-3.5" />
                Itinéraire
                <ArrowUpRight aria-hidden className="size-3.5" />
              </span>
            </TrackedLink>
          </section>
        )}

        <footer className="mt-12">
          <div className="h-px bg-[var(--pc-ink)]" />
          <div className="mt-[3px] h-[3px] bg-[var(--pc-ink)]" />
          <div className="flex items-center justify-between pt-3">
            <span className="font-[family-name:var(--pc-display)] text-[14px] italic text-[var(--pc-ink-2)]">Carte NFC · Tap</span>
            <ShareControl
              url={profile.canonicalUrl}
              title={identity.displayName}
              profileId={profile.id}
              preview={preview}
              showLabel
              label="Partager"
              className="h-9 text-[12px] font-medium uppercase tracking-[0.16em]"
            />
          </div>
        </footer>
      </div>
    </main>
  );
}

function Rubric({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="h-px flex-1 bg-[var(--pc-ink)]" />
      <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.24em]">{children}</h2>
      <span aria-hidden className="h-px flex-1 bg-[var(--pc-ink)]" />
    </div>
  );
}
