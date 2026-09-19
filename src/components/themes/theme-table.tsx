import { ArrowUpRight, UserRoundPlus } from "lucide-react";
import { Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { tableDisplay } from "./premium/font-table";
import { buildCardModel } from "./premium/model";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * TABLE - Hospitality · Warm · Inviting.
 *
 * Le parti pris : une devanture, puis une carte de restaurant. La photo du
 * lieu occupe tout le haut, bord a bord ; le portrait de l hote - ou le
 * logo - s y pose en medaillon, comme un sceau. En dessous, tout est compose
 * comme un menu imprime : l enseigne centree en serif genereuse, la
 * signature de l hote en italique, un fleuron entre deux filets.
 *
 * Les horaires se lisent comme une ligne de carte, avec des points de
 * conduite. La destination principale - reservation, menu, boutique - est
 * le seul aplat colore de la page. Les autres liens deviennent les plats de
 * la carte : un intitule, des points de conduite, une description en
 * italique. Aucune tuile, aucune pastille, aucune icone pour meubler.
 */
const SERIF = "font-[family-name:var(--pc-display)]";
const CAPS = "text-[11.5px] font-semibold uppercase tracking-[0.24em]";

export function ThemeTable({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "table");
  const { identity, location } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const banner = identity.coverUrl ?? identity.avatarUrl;
  const seal = identity.logoUrl ?? (identity.coverUrl ? identity.avatarUrl : null);
  const rest = m.destinations.filter((d) => d.id !== m.featured?.id);

  const house = identity.company && identity.company !== identity.displayName ? identity.company : null;
  const signature = house ? [m.name.full, identity.title].filter(Boolean).join(", ") : identity.title;

  // "Ouvert aujourd hui · 12 h – 23 h" devient une ligne de carte : le libelle,
  // des points de conduite, l horaire. Sans separateur, la phrase reste entiere.
  const hours = m.availability ? splitHours(m.availability) : null;

  return (
    <main
      style={m.style}
      className={cn(tableDisplay.variable, "min-h-dvh overflow-x-clip bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased")}
    >
      <div className="mx-auto w-full max-w-[460px] pb-12">
        {/* ------------------------------------------------------ Devanture */}
        <section className="relative">
          <div className="pc-fade relative h-[clamp(250px,68vw,310px)] overflow-hidden bg-[var(--pc-surface)]">
            <div className="pc-settle absolute inset-0">
              <Portrait
                src={banner}
                alt=""
                sizes="(max-width: 460px) 100vw, 460px"
                position={identity.coverUrl ? "50% 50%" : m.photoPosition}
                className="size-full"
                fallback={<Awning />}
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-24"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)" }}
            />
            <div className="absolute inset-x-0 top-[max(8px,env(safe-area-inset-top))] flex items-center justify-between px-4">
              {m.region ? (
                <span className="min-w-0 truncate text-[11.5px] font-semibold uppercase tracking-[0.22em] text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]">
                  {m.region}
                </span>
              ) : (
                <span />
              )}
              <ShareControl
                url={profile.canonicalUrl}
                title={identity.displayName}
                profileId={profile.id}
                preview={preview}
                className="-mr-1 size-11 shrink-0 rounded-full bg-black/30 text-white"
              />
            </div>
          </div>

          {/* Medaillon de l hote, pose a cheval sur la photo. */}
          {seal && (
            <div
              className="pc-lift absolute bottom-0 left-1/2 size-[92px] -translate-x-1/2 translate-y-1/2 rounded-full bg-[var(--pc-bg)] p-[5px]"
              style={{ "--d": "120ms" } as React.CSSProperties}
            >
              <div className="relative size-full overflow-hidden rounded-full border border-[var(--pc-line)] bg-[var(--pc-surface)]">
                <Portrait
                  src={seal}
                  alt=""
                  sizes="82px"
                  position={identity.logoUrl ? "50% 50%" : m.photoPosition}
                  className="size-full"
                  imageClassName={identity.logoUrl ? "object-contain p-2" : undefined}
                  fallback={null}
                />
              </div>
            </div>
          )}
        </section>

        <div className="px-6">
          {/* -------------------------------------------------- L enseigne */}
          <header className={cn("text-center", seal ? "pt-[70px]" : "pt-10")}>
            <Name
              className={cn(
                SERIF,
                "pc-rise text-[clamp(38px,11.5vw,48px)] font-normal leading-[1] tracking-[-0.01em] [text-wrap:balance]",
              )}
              style={{ "--d": "160ms" } as React.CSSProperties}
            >
              {house ?? m.name.full}
            </Name>
            {signature && (
              <p
                className={cn(SERIF, "pc-rise mt-3 text-[17px] italic leading-snug text-[var(--pc-ink-2)] [text-wrap:balance]")}
                style={{ "--d": "210ms" } as React.CSSProperties}
              >
                {signature}
              </p>
            )}
            <Fleuron className="pc-rise mt-6" />
          </header>

          {hours && (
            <p
              className="pc-rise mt-6 flex items-baseline gap-2 text-[15px]"
              style={{ "--d": "260ms" } as React.CSSProperties}
            >
              {hours.time ? (
                <>
                  <span className={cn(SERIF, "shrink-0 text-[18px] italic")}>{hours.label}</span>
                  <Leader />
                  <span className="shrink-0 font-medium tabular-nums">{hours.time}</span>
                </>
              ) : (
                <span className={cn(SERIF, "w-full text-center text-[18px] italic")}>{hours.label}</span>
              )}
            </p>
          )}

          {/* -------------------------------- La destination principale */}
          {m.featured && (
            <TrackedLink
              href={m.featured.href}
              profileId={profile.id}
              action="LINK"
              linkId={m.featured.id.startsWith("profile-") ? null : m.featured.id}
              preview={preview}
              external={m.featured.external}
              className="pc-rise group mt-7 flex items-center justify-between gap-4 rounded-[var(--pc-radius)] bg-[var(--pc-accent)] px-6 py-5 text-[var(--pc-bg)]"
              style={{ "--d": "300ms" } as React.CSSProperties}
            >
              <span className="min-w-0">
                <span className={cn(CAPS, "block text-[11px] opacity-90")}>{m.featured.kind}</span>
                <span className={cn(SERIF, "mt-1.5 block text-[26px] leading-[1.05] [text-wrap:balance]")}>
                  {m.featured.label}
                </span>
              </span>
              <ArrowUpRight
                aria-hidden
                className="size-6 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={1.5}
              />
            </TrackedLink>
          )}

          {/* -------------------------------------------- Garder le contact */}
          <div className={cn("pc-rise", m.featured ? "mt-3" : "mt-7")} style={{ "--d": "340ms" } as React.CSSProperties}>
            <SaveContact
              token={profile.cardToken}
              profileId={profile.id}
              name={identity.displayName}
              preview={preview}
              icon={<UserRoundPlus className="size-[18px]" strokeWidth={1.8} />}
              className="h-[54px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] text-[15px] font-semibold text-[var(--pc-cta-ink)]"
            />
          </div>

          {(m.actions.length > 0 || m.mapHref) && (
            <nav
              aria-label="Contacter"
              className="pc-rise mt-2 flex flex-wrap items-center justify-center"
              style={{ "--d": "380ms" } as React.CSSProperties}
            >
              {[
                ...m.actions.map((a) => ({ key: a.kind, label: a.label, href: a.href, action: a.action, linkId: a.linkId, external: a.external })),
                ...(m.mapHref && !m.place
                  ? [{ key: "map", label: "Venir", href: m.mapHref, action: "DIRECTIONS" as const, linkId: null, external: true }]
                  : []),
              ].map((a, i) => (
                <span key={a.key} className="flex items-center">
                  {i > 0 && <Diamond />}
                  <TrackedLink
                    href={a.href}
                    profileId={profile.id}
                    action={a.action}
                    linkId={a.linkId}
                    preview={preview}
                    external={a.external}
                    className={cn(CAPS, "inline-flex h-12 items-center px-3 text-[11.5px] text-[var(--pc-ink)] hover:text-[var(--pc-accent)]")}
                  >
                    {a.label}
                  </TrackedLink>
                </span>
              ))}
            </nav>
          )}

          {/* ------------------------------------------------- A la carte */}
          {rest.length > 0 && (
            <section className="mt-14">
              <Heading>À la carte</Heading>
              <ul className="mt-6 space-y-1">
                {rest.map((link) => (
                  <li key={link.id} className="pc-inview">
                    <TrackedLink
                      href={link.href}
                      profileId={profile.id}
                      action="LINK"
                      linkId={link.id.startsWith("profile-") ? null : link.id}
                      preview={preview}
                      external={link.external}
                      className="group block py-3"
                    >
                      <span className="flex items-baseline gap-2">
                        <span className={cn(SERIF, "min-w-0 text-[21px] leading-tight")}>{link.label}</span>
                        <Leader />
                        <ArrowUpRight
                          aria-hidden
                          className="size-[16px] shrink-0 translate-y-[2px] text-[var(--pc-accent)] transition-transform duration-300 group-hover:translate-x-0.5"
                          strokeWidth={1.8}
                        />
                      </span>
                      {link.detail && (
                        <span className={cn(SERIF, "mt-1 block text-[15px] italic text-[var(--pc-ink-2)]")}>{link.detail}</span>
                      )}
                    </TrackedLink>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* --------------------------------------------- Notre histoire */}
          {intro && (
            <section className="pc-inview mt-14 text-center">
              <Heading>Notre histoire</Heading>
              <p className="mx-auto mt-5 max-w-[34ch] text-[16px] leading-[1.7] text-[var(--pc-ink-2)] [text-wrap:pretty]">
                {intro}
              </p>
              {house && (
                <p className={cn(SERIF, "mt-4 text-[17px] italic")}>
                  {m.name.full}
                </p>
              )}
            </section>
          )}

          {/* ----------------------------------------------- Nous trouver */}
          {m.place && m.mapHref && (
            <section className="pc-inview mt-14 text-center">
              <Heading>Nous trouver</Heading>
              <p className={cn(SERIF, "mt-5 text-[24px] leading-[1.15] [text-wrap:balance]")}>{m.place}</p>
              {location.country && <p className="mt-1.5 text-[14px] text-[var(--pc-ink-2)]">{location.country}</p>}
              <TrackedLink
                href={m.mapHref}
                profileId={profile.id}
                action="DIRECTIONS"
                preview={preview}
                external
                className={cn(CAPS, "mt-2 inline-flex h-12 items-center gap-1.5 px-2 text-[var(--pc-accent)]")}
              >
                Itinéraire
                <ArrowUpRight aria-hidden className="size-4" strokeWidth={2} />
              </TrackedLink>
            </section>
          )}

          {m.social.length > 0 && (
            <nav aria-label="Réseaux" className="pc-inview mt-10 flex flex-wrap items-center justify-center">
              {m.social.map((link, i) => (
                <span key={link.id} className="flex items-center">
                  {i > 0 && <Diamond />}
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id}
                    preview={preview}
                    external={link.external}
                    className={cn(SERIF, "inline-flex h-11 items-center px-3 text-[18px] italic hover:text-[var(--pc-accent)]")}
                  >
                    {link.label}
                  </TrackedLink>
                </span>
              ))}
            </nav>
          )}

          <footer className="mt-12 flex items-center justify-between border-t border-[var(--pc-line)] pt-3">
            <span className="text-[12px] text-[var(--pc-ink-2)]">Carte NFC · Tap</span>
            <ShareControl
              url={profile.canonicalUrl}
              title={identity.displayName}
              profileId={profile.id}
              preview={preview}
              showLabel
              label="Partager"
              className="-mr-3 h-11 rounded-full px-3 text-[13.5px] font-medium hover:bg-[var(--pc-press)]"
            />
          </footer>
        </div>
      </div>
    </main>
  );
}

function splitHours(text: string): { label: string; time: string | null } {
  const parts = text.split(/\s+[·|]\s+/);
  if (parts.length >= 2 && /\d/.test(parts[parts.length - 1])) {
    return { label: parts.slice(0, -1).join(" · "), time: parts[parts.length - 1] };
  }
  return { label: text, time: null };
}

/** Points de conduite, comme entre un plat et son prix. */
function Leader() {
  return (
    <span
      aria-hidden
      className="min-w-4 flex-1 translate-y-[-4px] self-end border-b-2 border-dotted border-[var(--pc-line)]"
      style={{ borderColor: "color-mix(in srgb, var(--pc-ink) 28%, transparent)" }}
    />
  );
}

function Diamond() {
  return <span aria-hidden className="size-[5px] rotate-45 bg-[var(--pc-accent)]" />;
}

/** Fleuron : deux filets, un losange. */
function Fleuron({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("flex items-center justify-center gap-3", className)} style={{ "--d": "240ms" } as React.CSSProperties}>
      <span className="h-px w-12" style={{ background: "color-mix(in srgb, var(--pc-ink) 22%, transparent)" }} />
      <span className="size-[6px] rotate-45 bg-[var(--pc-accent)]" />
      <span className="h-px w-12" style={{ background: "color-mix(in srgb, var(--pc-ink) 22%, transparent)" }} />
    </span>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center">
      <span className={cn(SERIF, "block text-[28px] italic leading-none")}>{children}</span>
      <Fleuron className="mt-3" />
    </h2>
  );
}

/** Sans photo : un store de devanture, bandes de la couleur de la maison. */
function Awning() {
  return (
    <div
      className="size-full"
      style={{
        background:
          "repeating-linear-gradient(90deg, var(--pc-accent) 0 34px, color-mix(in srgb, var(--pc-accent) 78%, var(--pc-bg)) 34px 68px)",
      }}
    />
  );
}
