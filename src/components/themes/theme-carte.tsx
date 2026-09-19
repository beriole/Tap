import Image from "next/image";
import { ArrowUpRight, UserRoundPlus } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { NfcWaves } from "@/components/brand/logo";
import { FlipCard, Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { carteDisplay } from "./premium/font-carte";
import { buildCardModel } from "./premium/model";
import { GRAIN } from "./premium/paper";
import { formatPhone, normalizePhone } from "@/lib/events/phone";
import { isValidCardToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * CARTE - Tangible · Signature · Modern.
 *
 * Le parti pris : prolonger l objet qu on vient de tenir. La page s ouvre sur
 * la carte NFC elle-meme, a ses proportions reelles, dans sa matiere : noir
 * mat grave au laser, ou blanc nacre. Comme une carte de paiement haut de
 * gamme, elle ne porte presque rien :
 *  - recto : le monogramme ou le logo, la puce, le symbole sans contact, et
 *    le nom grave en bas - l identite seule ;
 *  - verso : les coordonnees en colonne etiquetee, et le QR.
 *
 * Sous elle, la page est volontairement sobre : une presentation, le bouton
 * principal, une rangee d actions tenue par deux filets, puis les liens en
 * liste typographique. Pas de cadres, pas de pastilles : la carte est
 * l evenement, le reste s efface.
 */
export function ThemeCarte({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "carte");
  const { identity, location, contact } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const token = profile.cardToken;
  const qrReady = !preview && isValidCardToken(token);

  // Nacre (carte claire) ou noir mat (carte sombre) : la matiere change la
  // lumiere, la puce et la gravure.
  const pearl = m.variant.key === "pearl";

  const fields = [
    ["Tél.", (contact.phone && formatPhone(normalizePhone(contact.phone).e164)) || contact.phone],
    ["Mail", contact.email],
    ["Web", contact.website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") ?? null],
    ["Lieu", [location.city, location.country].filter(Boolean).join(", ") || null],
  ].filter((f): f is [string, string] => Boolean(f[1]));

  /* ---------------------------------------------------------------- matiere */

  const face = cn(
    "relative flex size-full overflow-hidden rounded-[14px] bg-[var(--pc-x-card)] text-[var(--pc-x-cardInk)]",
    pearl
      ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.3),0_28px_50px_-26px_rgba(0,0,0,0.9)]"
      : "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_0_0_0_1px_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.12),0_26px_44px_-24px_rgba(0,0,0,0.55)]",
  );

  // La matiere : grain fin, une lumiere rasante, et pour la nacre un reflet
  // irise tres pale qui ne se voit qu en regardant.
  const material = (
    <>
      <span
        aria-hidden
        className={cn("pointer-events-none absolute inset-0", pearl ? "opacity-[0.1] mix-blend-multiply" : "opacity-[0.2] mix-blend-overlay")}
        style={{ backgroundImage: GRAIN }}
      />
      {pearl && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{
            background:
              "conic-gradient(from 210deg at 72% 28%, rgba(160,188,255,0.8), rgba(255,196,222,0.65), rgba(186,250,220,0.6), rgba(255,230,184,0.65), rgba(160,188,255,0.8))",
          }}
        />
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: pearl
            ? "linear-gradient(118deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 34%, rgba(255,255,255,0) 64%, rgba(255,255,255,0.35) 100%)"
            : "linear-gradient(118deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 36%, rgba(255,255,255,0) 66%, rgba(255,255,255,0.035) 100%)",
        }}
      />
    </>
  );

  // Gravure : une arete claire sous la lettre, une ombre au-dessus.
  const engraved: React.CSSProperties = {
    textShadow: pearl
      ? "0 1px 0 rgba(255,255,255,0.85), 0 -0.5px 0 rgba(0,0,0,0.12)"
      : "0 -1px 0 rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.07)",
  };

  const mark = identity.logoUrl ? (
    <Portrait
      src={identity.logoUrl}
      alt=""
      sizes="40px"
      position="50% 50%"
      priority={false}
      className="size-9 rounded-[8px]"
      imageClassName="object-contain"
      fallback={null}
    />
  ) : (
    <span aria-hidden className="font-[family-name:var(--pc-display)] text-[17px] font-semibold tracking-[0.04em]" style={engraved}>
      {m.name.initials}
    </span>
  );

  /* ---------------------------------------------------------------- faces */

  const front = (
    <div className={face}>
      {material}
      <div className="relative flex flex-1 flex-col justify-between p-[7%]">
        <div className="flex items-start justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {mark}
            {identity.company && (
              <span
                className="truncate text-[9px] font-medium uppercase tracking-[0.26em] text-[var(--pc-x-cardInk2)]"
                style={engraved}
              >
                {identity.company}
              </span>
            )}
          </div>
          <NfcWaves className="mt-0.5 size-[22px] shrink-0 text-[var(--pc-x-cardInk2)]" strokeWidth={1.6} />
        </div>

        <Chip pearl={pearl} />

        <div className="min-w-0">
          <Name
            className="truncate font-[family-name:var(--pc-display)] text-[clamp(19px,5.6vw,23px)] font-medium leading-[1.1] tracking-[-0.02em]"
            style={engraved}
          >
            {m.name.full}
          </Name>
          {identity.title && (
            <p className="mt-1.5 truncate text-[9.5px] font-medium uppercase tracking-[0.2em] text-[var(--pc-x-cardInk2)]" style={engraved}>
              {identity.title}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const back = (
    <div className={face}>
      {material}
      <div className="relative flex min-w-0 flex-1 flex-col justify-between p-[7%]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--pc-display)] text-[15px] font-medium tracking-[-0.015em]" style={engraved}>
              {m.name.full}
            </p>
            {identity.title && (
              <p className="mt-1 line-clamp-2 text-[10.5px] leading-[1.4] text-[var(--pc-x-cardInk2)]">{identity.title}</p>
            )}
          </div>
          {qrReady ? (
            <span className="block size-[64px] shrink-0 overflow-hidden rounded-[6px] bg-white p-[5px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
              <Image src={`/api/qr/${token}`} alt="" width={54} height={54} unoptimized className="size-full" />
            </span>
          ) : (
            <NfcWaves className="size-[22px] shrink-0 text-[var(--pc-x-cardInk2)]" strokeWidth={1.6} />
          )}
        </div>

        <dl className="space-y-[5px]">
          {fields.map(([key, value]) => (
            <div key={key} className="grid grid-cols-[38px_1fr] items-baseline gap-2">
              <dt className="text-[8.5px] font-medium uppercase tracking-[0.18em] text-[var(--pc-x-cardInk2)]">{key}</dt>
              <dd className="min-w-0 truncate font-[family-name:var(--pc-display)] text-[11px] tracking-[-0.005em]">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );

  /* ---------------------------------------------------------------- page */

  return (
    <main
      style={m.style}
      className={cn(carteDisplay.variable, "min-h-dvh bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased")}
    >
      <div className="mx-auto w-full max-w-[440px] px-5 pb-14 pt-[max(12px,env(safe-area-inset-top))] md:pt-10">
        <header className="pc-fade flex h-12 items-center justify-between" style={{ "--d": "0ms" } as React.CSSProperties}>
          <span className="flex items-center gap-2 font-[family-name:var(--pc-display)] text-[12.5px] font-medium tracking-[-0.005em] text-[var(--pc-ink-2)]">
            <NfcWaves className="size-4" strokeWidth={1.8} />
            Carte de visite
          </span>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            className="-mr-2 size-11 rounded-full text-[var(--pc-ink-2)] hover:bg-[var(--pc-press)]"
          />
        </header>

        <section className="pc-lift mt-5" style={{ "--d": "60ms" } as React.CSSProperties}>
          <FlipCard className="aspect-[85.6/54] rounded-[14px]" front={front} back={back} hint={null} />
          <p aria-hidden className="mt-4 text-center text-[10.5px] font-medium uppercase tracking-[0.24em] text-[var(--pc-ink-2)]">
            Toucher pour retourner
          </p>
        </section>

        {intro && (
          <section
            className="pc-rise mt-9 flex items-start gap-4"
            style={{ "--d": "180ms" } as React.CSSProperties}
          >
            {identity.avatarUrl && (
              <div className="relative size-[52px] shrink-0 overflow-hidden rounded-full bg-[var(--pc-surface)]">
                <Portrait
                  src={identity.avatarUrl}
                  alt={identity.displayName}
                  sizes="52px"
                  position={m.photoPosition}
                  className="size-full"
                  fallback={null}
                />
              </div>
            )}
            <div className="min-w-0">
              {intro && <p className="text-[15px] leading-[1.6] text-[var(--pc-ink-2)]">{intro}</p>}
            </div>
          </section>
        )}

        <div className="pc-rise mt-8" style={{ "--d": "240ms" } as React.CSSProperties}>
          <SaveContact
            token={profile.cardToken}
            profileId={profile.id}
            name={identity.displayName}
            preview={preview}
            icon={<UserRoundPlus className="size-[18px]" strokeWidth={1.8} />}
            className="h-[54px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] text-[15px] font-medium tracking-[-0.01em] text-[var(--pc-cta-ink)]"
          />
        </div>

        {/* Les actions : une rangee tenue par deux filets, comme la tranche d une carte. */}
        {m.actions.length > 0 && (
          <nav
            aria-label="Contacter"
            className="pc-rise mt-3 grid border-y border-[var(--pc-line)]"
            style={
              { "--d": "290ms", gridTemplateColumns: `repeat(${m.actions.length}, minmax(0, 1fr))` } as React.CSSProperties
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
                  "my-2 flex h-11 items-center justify-center gap-2 text-[13.5px] font-medium",
                  i > 0 && "border-l border-[var(--pc-line)]",
                )}
              >
                <ActionIcon kind={a.kind} className="size-[15px] text-[var(--pc-ink-2)]" strokeWidth={1.7} />
                {a.label}
              </TrackedLink>
            ))}
          </nav>
        )}

        {m.destinations.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[10.5px] font-medium uppercase tracking-[0.24em] text-[var(--pc-ink-2)]">Liens</h2>
            <ol className="mt-2">
              {m.destinations.map((link, i) => (
                <li key={link.id} className="pc-inview border-b border-[var(--pc-line)]">
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id.startsWith("profile-") ? null : link.id}
                    preview={preview}
                    external={link.external}
                    className="group flex min-h-[60px] items-center gap-4 py-3"
                  >
                    <span aria-hidden className="w-5 shrink-0 font-[family-name:var(--pc-display)] text-[11px] tabular-nums text-[var(--pc-ink-2)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-[family-name:var(--pc-display)] text-[15.5px] font-medium tracking-[-0.015em]">
                        {link.label}
                      </span>
                      {link.detail && <span className="mt-0.5 block truncate text-[13px] text-[var(--pc-ink-2)]">{link.detail}</span>}
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="size-4 shrink-0 text-[var(--pc-ink-2)] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      strokeWidth={1.7}
                    />
                  </TrackedLink>
                </li>
              ))}
            </ol>
          </section>
        )}

        {m.social.length > 0 && (
          <ul className="pc-inview -ml-3 mt-8 flex flex-wrap">
            {m.social.map((link) => (
              <li key={link.id}>
                <TrackedLink
                  href={link.href}
                  profileId={profile.id}
                  action="LINK"
                  linkId={link.id}
                  preview={preview}
                  external={link.external}
                  ariaLabel={link.label}
                  className="flex size-11 items-center justify-center rounded-full text-[var(--pc-ink-2)] hover:bg-[var(--pc-press)] hover:text-[var(--pc-ink)]"
                >
                  <BrandIcon name={link.icon ?? link.type} className="size-[19px]" />
                </TrackedLink>
              </li>
            ))}
          </ul>
        )}

        {m.place && m.mapHref && (
          <TrackedLink
            href={m.mapHref}
            profileId={profile.id}
            action="DIRECTIONS"
            preview={preview}
            external
            className="pc-inview mt-6 flex min-h-[56px] items-center justify-between gap-4 border-t border-[var(--pc-line)] pt-4"
          >
            <span className="min-w-0">
              <span className="block truncate text-[14.5px]">{m.place}</span>
              {location.country && <span className="block text-[12.5px] text-[var(--pc-ink-2)]">{location.country}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium">
              Itinéraire
              <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.8} />
            </span>
          </TrackedLink>
        )}

        <footer className="mt-12 flex items-center justify-between border-t border-[var(--pc-line)] pt-4">
          <span className="flex items-center gap-2 text-[12px] text-[var(--pc-ink-2)]">
            <NfcWaves className="size-3.5" strokeWidth={1.8} />
            Carte NFC · Tap
          </span>
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
    </main>
  );
}

/**
 * La puce : un metal brosse et ses plages de contact. Or pale sur la carte
 * noire, argent sur la nacre - jamais la couleur d accent du client, une
 * puce n est pas un signal.
 */
function Chip({ pearl }: { pearl: boolean }) {
  const metal = pearl
    ? "linear-gradient(135deg, #D9D8D4 0%, #F4F3EF 38%, #BEBCB6 62%, #E3E1DC 100%)"
    : "linear-gradient(135deg, #B99A6A 0%, #E6CFA2 38%, #A88A5C 62%, #D2B888 100%)";
  return (
    <span
      aria-hidden
      className="relative block h-[16%] min-h-[26px] w-auto max-w-[44px] self-start rounded-[5px] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.08)]"
      style={{ aspectRatio: "4 / 3", background: metal }}
    >
      <svg viewBox="0 0 40 30" fill="none" className="absolute inset-0 size-full" preserveAspectRatio="none">
        <g stroke="rgba(0,0,0,0.32)" strokeWidth="0.8">
          <path d="M0 10h13M0 20h13M27 10h13M27 20h13M13 0v30M27 0v30" />
          <rect x="13" y="10" width="14" height="10" rx="2" />
        </g>
      </svg>
    </span>
  );
}
