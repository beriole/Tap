import { ArrowUpRight, MapPin, Plus } from "lucide-react";
import Image from "next/image";
import { FlipCard, Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { GRAIN } from "./premium/paper";
import { formatPhone, normalizePhone } from "@/lib/events/phone";
import { isValidCardToken } from "@/lib/tokens";
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
/** Dorure a chaud : un degrade sur le texte, jamais un aplat d or. */
const foil = "bg-[linear-gradient(135deg,var(--pc-accent)_0%,color-mix(in_srgb,var(--pc-accent)_55%,white)_45%,var(--pc-accent)_75%)] bg-clip-text text-transparent";

export function ThemeObsidian({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "obsidian");
  const { identity } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const { contact, location } = profile;
  const token = profile.cardToken;
  const qrReady = !preview && isValidCardToken(token);
  // Les coordonnees ecrites au verso, comme sur une carte imprimee.
  const cardLines = [
    (contact.phone && formatPhone(normalizePhone(contact.phone).e164)) || contact.phone,
    contact.email,
    contact.website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
    [location.city, location.country].filter(Boolean).join(", ") || null,
  ].filter((l): l is string => Boolean(l));

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

        {/* La carte : un objet noir a deux faces. Recto, l identite seule ;
            verso, les coordonnees ecrites et le QR. On la retourne du doigt. */}
        <section className="pc-lift mt-4" style={{ "--d": "120ms" } as React.CSSProperties}>
          <FlipCard
            className="aspect-[85/55] rounded-[10px]"
            front={
              <div className="relative flex size-full flex-col items-center justify-center overflow-hidden rounded-[10px] bg-[var(--pc-x-card)] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_0_0_1px_rgba(255,255,255,0.07),0_30px_60px_-30px_rgba(0,0,0,0.9)]">
                <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
                {/* Une lumiere rasante, d un seul cote : le mat se lit par elle. */}
                <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.07) 0%, transparent 38%, transparent 62%, rgba(255,255,255,0.03) 100%)" }} />
                {identity.logoUrl ? (
                  <Portrait src={identity.logoUrl} alt="" sizes="72px" position="50% 50%" priority={false} className="size-[68px] rounded-[8px]" imageClassName="object-contain" fallback={null} />
                ) : (
                  <span aria-hidden className={cn(foil, "font-[family-name:var(--pc-display)] text-[clamp(44px,13vw,56px)] italic leading-none")}>
                    {m.name.initials}
                  </span>
                )}
                <Name className="mt-4 text-center text-[11px] font-medium uppercase tracking-[0.34em] text-[var(--pc-ink)]">{m.name.full}</Name>
                {identity.company && <p className="mt-1.5 text-[9.5px] uppercase tracking-[0.28em] text-[var(--pc-ink-3)]">{identity.company}</p>}
              </div>
            }
            back={
              <div className="relative flex size-full overflow-hidden rounded-[10px] bg-[var(--pc-x-card)] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_0_0_1px_rgba(255,255,255,0.07),0_30px_60px_-30px_rgba(0,0,0,0.9)]">
                <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
                <div className="flex min-w-0 flex-1 flex-col justify-between p-[18px]">
                  <div>
                    <p className="font-[family-name:var(--pc-display)] text-[clamp(19px,5.6vw,23px)] leading-[1.05] tracking-[-0.01em]">{m.name.full}</p>
                    {identity.title && <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-[1.4] text-[var(--pc-ink-2)]">{identity.title}</p>}
                  </div>
                  <ul className="space-y-[3px] text-[10px] leading-[1.4] text-[var(--pc-ink-2)]">
                    {cardLines.map((line) => (
                      <li key={line} className="truncate">
                        <span aria-hidden className="mr-2 inline-block h-px w-2.5 translate-y-[-3px] bg-[var(--pc-accent)]" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
                {qrReady && (
                  <div className="flex shrink-0 flex-col items-end justify-between p-[18px] pl-0">
                    <span className={cn(foil, "font-[family-name:var(--pc-display)] text-[20px] italic leading-none")}>{m.name.initials}</span>
                    <span className="block size-[60px] overflow-hidden rounded-[4px] bg-[#F7F4EE] p-1">
                      <Image src={`/api/qr/${profile.cardToken}`} alt="" width={52} height={52} unoptimized className="size-full" />
                    </span>
                  </div>
                )}
              </div>
            }
          />
        </section>

        {/* L epreuve : le portrait, plus petit que la carte, sous passe-partout. */}
        {identity.avatarUrl && (
          <section className="mt-9 flex justify-center">
            <div className="relative w-[46%] max-w-[200px]">
              <div aria-hidden className="pc-fade pointer-events-none absolute -inset-[9px] border border-[var(--pc-line)]" style={{ "--d": "300ms" } as React.CSSProperties} />
              <div className="pc-fade relative aspect-[4/5] overflow-hidden bg-[var(--pc-surface)]" style={{ "--d": "260ms" } as React.CSSProperties}>
                <div className="pc-settle absolute inset-0">
                  <Portrait src={identity.avatarUrl} alt={identity.displayName} sizes="(max-width: 440px) 46vw, 200px" position={m.photoPosition} className="size-full" fallback={null} />
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mt-7 text-center">
          {m.role.length > 0 && (
            <p className="pc-rise text-[15px] leading-[1.5] text-[var(--pc-ink-2)]" style={{ "--d": "250ms" } as React.CSSProperties}>
              {identity.title}
              {identity.title && identity.company && (
                <span aria-hidden className="mx-2 text-[var(--pc-accent)]">
                  ·
                </span>
              )}
              {identity.company}
            </p>
          )}
          <div aria-hidden className="pc-draw mx-auto mt-5 h-px w-10 bg-[var(--pc-accent)]" style={{ "--d": "320ms", transformOrigin: "center" } as React.CSSProperties} />
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
