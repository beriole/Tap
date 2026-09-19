import Image from "next/image";
import { ArrowUpRight, MapPin, UserRoundPlus } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { FlipCard, Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { obsidianDisplay } from "./premium/font-obsidian";
import { instantHand } from "./premium/font-instant";
import { buildCardModel } from "./premium/model";
import { GRAIN } from "./premium/paper";
import { formatPhone, normalizePhone } from "@/lib/events/phone";
import { isValidCardToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * INSTANT - Playful · Personal · Warm.
 *
 * Le parti pris : une presentation qui ressemble a une rencontre, pas a un
 * CV. L objet est un tirage instantane, pose de travers sur un second
 * tirage, qu on retourne comme on retourne une photo pour lire ce qu il y a
 * derriere :
 *  - recto : le portrait dans son cadre blanc, large marge en pied, et une
 *    legende ecrite au feutre ;
 *  - verso : le dos du tirage, un papier mat a peine grene, les coordonnees
 *    ecrites a la main a l encre bleue, et le QR colle comme une etiquette.
 *
 * L inclinaison est fixe : c est une composition, pas une animation. Le
 * reste de la page reste net et lisible - la fantaisie est dans l objet,
 * jamais dans l information.
 */

/** Encre de stylo bille bleu nuit : 10:1 sur le papier du verso. */
const INK = "#22315C";
/** Papier du dos d un tirage : un blanc casse, plus mat que le recto. */
const PAPER = "#F5EFE4";
/** L ombre d un tirage pose a plat : courte et douce, jamais un halo. */
const PRINT_SHADOW = "0 1px 2px rgba(0,0,0,0.1), 0 20px 34px -20px rgba(0,0,0,0.5)";

export function ThemeInstant({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "instant");
  const { identity, location, contact } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const caption = [m.name.first, location.city].filter(Boolean).join(", ");
  const photo = identity.avatarUrl ?? identity.coverUrl;
  const token = profile.cardToken;
  const qrReady = !preview && isValidCardToken(token);
  const hand = "font-[family-name:var(--pc-hand)]";

  // Ce qu on ecrit au dos, ligne a ligne, comme on le ferait au stylo.
  const lines = [
    (contact.phone && formatPhone(normalizePhone(contact.phone).e164)) || contact.phone,
    contact.email,
    contact.website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
    m.social[0]?.hint ?? null,
    [location.city, location.country].filter(Boolean).join(", ") || null,
  ].filter((l): l is string => Boolean(l));

  /* ---------------------------------------------------------------- recto */

  const front = (
    <div className="relative flex size-full flex-col overflow-hidden rounded-[3px] bg-[var(--pc-surface)] px-[6%] pt-[6%]" style={{ boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.04), ${PRINT_SHADOW}` }}>
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
      <div className="relative aspect-square w-full overflow-hidden bg-[#34322D]">
        <Portrait
          src={photo}
          alt=""
          sizes="(max-width: 440px) 72vw, 290px"
          position={m.photoPosition}
          className="size-full"
          imageClassName="saturate-[1.06] contrast-[1.02]"
          fallback={
            // Sans photo : un film pas encore revele, l initiale ecrite dessus.
            <div
              className="flex size-full items-center justify-center"
              style={{ background: "radial-gradient(90% 90% at 35% 30%, #4A4841 0%, #2E2C28 70%, #25231F 100%)" }}
            >
              <span className={cn(hand, "text-[clamp(64px,22vw,96px)] font-semibold leading-none text-[#EDE6D8]/80")}>
                {m.name.initials}
              </span>
            </div>
          }
        />
        {/* Le film : un voile tres leger et un bord interieur, la photo est sous une couche. */}
        <span aria-hidden className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08),inset_0_0_24px_rgba(0,0,0,0.12)]" />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(125deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 40%)" }}
        />
      </div>
      <div className="relative flex flex-1 items-center justify-center pb-[2%]">
        <p className={cn(hand, "-rotate-[2deg] truncate text-[clamp(24px,7.4vw,30px)] font-medium leading-none text-[#2A2622]")}>
          {caption}
        </p>
      </div>
    </div>
  );

  /* ---------------------------------------------------------------- verso */

  const back = (
    <div className="relative flex size-full flex-col overflow-hidden rounded-[3px] px-[8%] pb-[6%] pt-[8%]" style={{ backgroundColor: PAPER, color: INK, boxShadow: PRINT_SHADOW }}>
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
      {/* L empreinte du fabricant, imprimee en travers du dos. */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-[6%] top-[7%] text-[8px] font-medium uppercase tracking-[0.3em] text-[#6E675D]"
      >
        Instant · Film
      </span>

      <div className="relative -rotate-[1.5deg]">
        <p className={cn(hand, "text-[clamp(30px,9vw,36px)] font-semibold leading-[0.95]")}>{m.name.full}</p>
        {m.role.map((r) => (
          <p key={r} className={cn(hand, "mt-0.5 truncate text-[clamp(18px,5.2vw,21px)] font-medium leading-[1.15]")}>
            {r}
          </p>
        ))}
        <span aria-hidden className="mt-2 block h-[2px] w-16 rounded-full opacity-60" style={{ background: INK }} />
      </div>

      <ul className={cn(hand, "relative mt-4 -rotate-[1deg] space-y-0.5 text-[clamp(18px,5.4vw,21px)] font-medium leading-[1.2]")}>
        {lines.map((line) => (
          <li key={line} className="[overflow-wrap:anywhere]">
            {line}
          </li>
        ))}
      </ul>

      {qrReady && (
        <div className="relative mt-auto flex items-end justify-end gap-2 pt-2">
          <span className={cn(hand, "mb-3 flex items-center gap-1 text-[18px] font-medium leading-none")}>
            scanne-moi
            <svg aria-hidden viewBox="0 0 34 18" fill="none" className="h-[14px] w-[28px]" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4c8 9 18 11 28 8" />
              <path d="M24 7l6 5-7 3" />
            </svg>
          </span>
          {/* Le QR colle comme une etiquette, un peu de travers. */}
          <span className="block size-[74px] shrink-0 rotate-[4deg] bg-white p-[6px] shadow-[0_1px_1px_rgba(0,0,0,0.12),0_4px_10px_-4px_rgba(0,0,0,0.25)]">
            <Image src={`/api/qr/${token}`} alt="" width={62} height={62} unoptimized className="size-full" />
          </span>
        </div>
      )}
    </div>
  );

  /* ---------------------------------------------------------------- page */

  return (
    <main
      style={m.style}
      className={cn(
        obsidianDisplay.variable,
        instantHand.variable,
        "relative min-h-dvh overflow-hidden bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased",
      )}
    >
      <div className="grain opacity-[0.07]" aria-hidden />

      <div className="relative mx-auto w-full max-w-[440px] px-6 pb-14 pt-[max(12px,env(safe-area-inset-top))] md:pt-10">
        <header className="pc-fade flex h-12 items-center justify-between" style={{ "--d": "0ms" } as React.CSSProperties}>
          {m.availability ? (
            <span className="inline-flex max-w-[75%] items-center gap-2 text-[12.5px] text-[var(--pc-ink-2)]">
              <span aria-hidden className="size-2 shrink-0 rounded-full bg-[var(--pc-accent)]" />
              <span className="truncate">{m.availability}</span>
            </span>
          ) : (
            <span />
          )}
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            className="-mr-2 size-11 rounded-full text-[var(--pc-ink-2)] hover:bg-[var(--pc-press)]"
          />
        </header>

        {/* Deux tirages : le second, dessous, ne fait que donner l epaisseur d une pile. */}
        <section className="relative mx-auto mt-6 w-[82%] max-w-[310px]">
          <div
            aria-hidden
            className="pc-fade absolute inset-x-0 top-0 aspect-[88/107] translate-x-[3%] rotate-[4.5deg] rounded-[3px] bg-[var(--pc-surface)] opacity-60 shadow-[0_10px_24px_-16px_rgba(0,0,0,0.5)]"
            style={{ "--d": "60ms" } as React.CSSProperties}
          />
          <div className="pc-lift relative -rotate-[2.5deg]" style={{ "--d": "120ms" } as React.CSSProperties}>
            <FlipCard className="aspect-[88/107] rounded-[3px]" front={front} back={back} hint={null} />
          </div>
          <p aria-hidden className={cn(hand, "mt-5 text-center text-[19px] font-medium leading-none text-[var(--pc-ink-2)]")}>
            touche pour lire le dos
          </p>
        </section>

        <section className="mt-8 text-center">
          <Name
            className="pc-rise text-[clamp(28px,8.4vw,34px)] font-bold leading-[1.05] tracking-[-0.035em]"
            style={{ "--d": "220ms" } as React.CSSProperties}
          >
            {m.name.full}
          </Name>
          {m.role.length > 0 && (
            <p className="pc-rise mt-1.5 text-[15.5px] text-[var(--pc-ink-2)]" style={{ "--d": "260ms" } as React.CSSProperties}>
              {m.role.join(" · ")}
            </p>
          )}
        </section>

        <div className="pc-rise mt-7" style={{ "--d": "300ms" } as React.CSSProperties}>
          <SaveContact
            token={profile.cardToken}
            profileId={profile.id}
            name={identity.displayName}
            preview={preview}
            icon={<UserRoundPlus className="size-[18px]" strokeWidth={2} />}
            className="h-[54px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] text-[15px] font-semibold text-[var(--pc-cta-ink)]"
          />
        </div>

        {m.actions.length > 0 && (
          <nav
            aria-label="Contacter"
            className="pc-rise mt-2.5 flex justify-center gap-2"
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
                className="flex h-[46px] min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--pc-line)] text-[13.5px] font-medium"
              >
                <ActionIcon kind={a.kind} className="size-[16px] shrink-0 text-[var(--pc-accent)]" />
                <span className="truncate">{a.label}</span>
              </TrackedLink>
            ))}
          </nav>
        )}

        {intro && (
          <p className="pc-inview mt-11 text-center font-[family-name:var(--pc-display)] text-[21px] italic leading-[1.4]">
            {intro}
          </p>
        )}

        {m.social.length > 0 && (
          <ul className="pc-inview mt-8 flex flex-wrap justify-center gap-2">
            {m.social.map((link) => (
              <li key={link.id}>
                <TrackedLink
                  href={link.href}
                  profileId={profile.id}
                  action="LINK"
                  linkId={link.id}
                  preview={preview}
                  external={link.external}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--pc-press)] px-4 text-[13.5px] font-medium"
                >
                  <BrandIcon name={link.icon ?? link.type} className="size-[16px]" />
                  {link.hint ?? link.label}
                </TrackedLink>
              </li>
            ))}
          </ul>
        )}

        {/* Les liens : une liste nette, un filet entre chaque. La fantaisie reste dans le tirage. */}
        {m.destinations.length > 0 && (
          <ul className="mt-10 border-t border-[var(--pc-line)]">
            {m.destinations.map((link) => (
              <li key={link.id} className="pc-inview border-b border-[var(--pc-line)]">
                <TrackedLink
                  href={link.href}
                  profileId={profile.id}
                  action="LINK"
                  linkId={link.id.startsWith("profile-") ? null : link.id}
                  preview={preview}
                  external={link.external}
                  className="group flex min-h-[62px] items-center gap-4 py-3"
                >
                  <BrandIcon name={link.icon ?? link.type} className="size-[18px] shrink-0 text-[var(--pc-accent)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15.5px] font-semibold tracking-[-0.01em]">{link.label}</span>
                    {link.detail && <span className="block truncate text-[13px] text-[var(--pc-ink-2)]">{link.detail}</span>}
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="size-4 shrink-0 text-[var(--pc-ink-2)] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
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
            className="pc-inview mx-auto mt-9 flex min-h-11 w-fit max-w-full items-center gap-2 rounded-full px-4 text-[14px]"
          >
            <MapPin aria-hidden className="size-4 shrink-0 text-[var(--pc-accent)]" />
            <span className="truncate">{m.place}</span>
            <span className="shrink-0 font-semibold underline underline-offset-4">Itinéraire</span>
          </TrackedLink>
        )}

        <footer className="mt-12 flex flex-col items-center gap-3">
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            showLabel
            label="Partager ce profil"
            className="h-11 rounded-full border border-[var(--pc-line)] px-5 text-[14px] font-medium"
          />
          <p className={cn(hand, "text-[19px] font-medium text-[var(--pc-ink-2)]")}>Carte NFC · Tap</p>
        </footer>
      </div>
    </main>
  );
}
