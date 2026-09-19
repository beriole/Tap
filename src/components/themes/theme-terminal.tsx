import Image from "next/image";
import { ArrowUpRight, UserRoundPlus } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { FlipCard, Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { buildCardModel } from "./premium/model";
import { formatPhone, normalizePhone } from "@/lib/events/phone";
import { isValidCardToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * TERMINAL - Tech founder.
 *
 * Le parti pris : la precision d un produit logiciel bien fait, sans le
 * costume du developpeur. Plus d invite de commande, plus de curseur, plus de
 * "whoami" : ces cliches disaient "geek", pas "fondateur". Ce qui reste du
 * monde technique, c est la RIGUEUR - une grille de points, une fonte mono
 * reservee aux etiquettes, des alignements au pixel, un seul signal de
 * couleur.
 *
 * La carte a deux faces :
 *  - recto : le nom en Geist tres serre, la fonction, et une grille de points
 *    qui s eclaire vers un coin - la seule image de la page ;
 *  - verso : les coordonnees en cles / valeurs alignees, et le QR.
 *
 * Polices : Geist et Geist Mono, deja chargees par la plateforme.
 */
export function ThemeTerminal({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "terminal");
  const { identity, location, contact } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const token = profile.cardToken;
  const qrReady = !preview && isValidCardToken(token);
  const mono = "font-[family-name:var(--font-mono)]";

  const fields = [
    ["tel", (contact.phone && formatPhone(normalizePhone(contact.phone).e164)) || contact.phone],
    ["mail", contact.email],
    ["web", contact.website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") ?? null],
    ["loc", [location.city, location.country].filter(Boolean).join(", ") || null],
  ].filter((f): f is [string, string] => Boolean(f[1]));

  const dots: React.CSSProperties = {
    backgroundImage: "radial-gradient(color-mix(in srgb, var(--pc-ink) 26%, transparent) 1px, transparent 1.3px)",
    backgroundSize: "12px 12px",
    maskImage: "radial-gradient(120% 120% at 100% 0%, black 0%, transparent 65%)",
  };
  const face =
    "relative flex size-full overflow-hidden rounded-[12px] bg-[var(--pc-surface)] ring-1 ring-[var(--pc-line)] shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_24px_50px_-28px_rgba(0,0,0,0.6)]";

  return (
    <main style={m.style} className="min-h-dvh bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased">
      <div className="mx-auto w-full max-w-[460px] px-5 pb-14 pt-[max(12px,env(safe-area-inset-top))] md:pt-10">
        <header className={cn(mono, "pc-fade flex h-12 items-center justify-between text-[11.5px] text-[var(--pc-ink-2)]")} style={{ "--d": "0ms" } as React.CSSProperties}>
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-1.5 rounded-full bg-[var(--pc-accent)]" />
            {m.availability ? <span className="truncate">{m.availability}</span> : <span>{identity.company ?? "Carte"}</span>}
          </span>
          <ShareControl url={profile.canonicalUrl} title={identity.displayName} profileId={profile.id} preview={preview} className="-mr-2 size-10 rounded-[10px] hover:bg-[var(--pc-press)]" />
        </header>

        <section className="pc-lift mt-4" style={{ "--d": "100ms" } as React.CSSProperties}>
          <FlipCard
            className="aspect-[85/55] rounded-[12px]"
            front={
              <div className={face}>
                <span aria-hidden className="absolute inset-0" style={dots} />
                <span aria-hidden className="absolute right-4 top-4 size-2 rounded-full bg-[var(--pc-accent)] shadow-[0_0_12px_var(--pc-accent)]" />
                <div className="relative flex flex-1 flex-col justify-between p-[18px]">
                  {identity.logoUrl ? (
                    <Portrait src={identity.logoUrl} alt="" sizes="32px" position="50% 50%" priority={false} className="size-8 rounded-[8px]" imageClassName="object-contain" fallback={null} />
                  ) : (
                    <span className={cn(mono, "text-[11px] text-[var(--pc-ink-2)]")}>{identity.company ?? m.name.initials}</span>
                  )}
                  <div>
                    <Name className="text-[clamp(24px,7.2vw,30px)] font-semibold leading-[1] tracking-[-0.04em]">
                      {m.name.first}
                      {m.name.last && (
                        <>
                          <br />
                          {m.name.last}
                        </>
                      )}
                    </Name>
                    {identity.title && <p className="mt-2 line-clamp-1 text-[12px] text-[var(--pc-ink-2)]">{identity.title}</p>}
                  </div>
                </div>
              </div>
            }
            back={
              <div className={face}>
                <div className="flex min-w-0 flex-1 flex-col justify-between p-[18px]">
                  <p className="text-[15px] font-semibold tracking-[-0.02em]">{m.name.full}</p>
                  <dl className={cn(mono, "space-y-[3px] text-[10.5px] leading-[1.45]")}>
                    {fields.map(([key, value]) => (
                      <div key={key} className="grid grid-cols-[34px_1fr] gap-2">
                        <dt className="text-[var(--pc-ink-3)]">{key}</dt>
                        <dd className={value.includes("@") ? "min-w-0 [overflow-wrap:anywhere]" : "min-w-0 truncate"}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                {qrReady && (
                  <div className="flex shrink-0 items-end p-[14px] pl-0">
                    <span className="block size-[62px] overflow-hidden rounded-[6px] bg-white p-1">
                      <Image src={`/api/qr/${token}`} alt="" width={54} height={54} unoptimized className="size-full" />
                    </span>
                  </div>
                )}
              </div>
            }
          />
        </section>

        <div className="pc-rise mt-6" style={{ "--d": "240ms" } as React.CSSProperties}>
          <SaveContact
            token={profile.cardToken}
            profileId={profile.id}
            name={identity.displayName}
            preview={preview}
            icon={<UserRoundPlus className="size-[18px]" strokeWidth={2} />}
            className="h-[52px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] px-5 text-[15px] font-semibold tracking-[-0.01em] text-[var(--pc-cta-ink)]"
          />
        </div>

        {m.actions.length > 0 && (
          <nav aria-label="Contacter" className="pc-rise mt-2.5 grid gap-2" style={{ "--d": "290ms", gridTemplateColumns: `repeat(${m.actions.length}, minmax(0, 1fr))` } as React.CSSProperties}>
            {m.actions.map((a) => (
              <TrackedLink key={a.kind} href={a.href} profileId={profile.id} action={a.action} linkId={a.linkId} preview={preview} external={a.external} className="flex h-[46px] items-center justify-center gap-2 rounded-[var(--pc-radius)] border border-[var(--pc-line)] text-[13px] font-medium hover:border-[var(--pc-accent)]">
                <ActionIcon kind={a.kind} className="size-[15px] text-[var(--pc-accent)]" />
                {a.label}
              </TrackedLink>
            ))}
          </nav>
        )}

        {/* A propos : portrait carre, texte a cote - la seule photographie de la page. */}
        {(intro || identity.avatarUrl) && (
          <section className="pc-inview mt-12 grid grid-cols-[72px_1fr] gap-4">
            {identity.avatarUrl ? (
              <div className="relative size-[72px] overflow-hidden rounded-[12px] bg-[var(--pc-surface)] ring-1 ring-[var(--pc-line)]">
                <Portrait src={identity.avatarUrl} alt={identity.displayName} sizes="72px" position={m.photoPosition} className="size-full" fallback={null} />
              </div>
            ) : (
              <span />
            )}
            <div className="min-w-0">
              <p className={cn(mono, "text-[11px] uppercase tracking-[0.12em] text-[var(--pc-ink-3)]")}>À propos</p>
              {intro && <p className="mt-2 text-[15.5px] leading-[1.6] text-[var(--pc-ink-2)]">{intro}</p>}
            </div>
          </section>
        )}

        {m.destinations.length > 0 && (
          <section className="mt-12">
            <p className={cn(mono, "text-[11px] uppercase tracking-[0.12em] text-[var(--pc-ink-3)]")}>Liens</p>
            <ul className="mt-3 border-t border-[var(--pc-line)]">
              {m.destinations.map((link) => (
                <li key={link.id} className="pc-inview border-b border-[var(--pc-line)]">
                  <TrackedLink href={link.href} profileId={profile.id} action="LINK" linkId={link.id.startsWith("profile-") ? null : link.id} preview={preview} external={link.external} className="group flex items-center gap-3 py-3.5">
                    <BrandIcon name={link.icon ?? link.type} className="size-[17px] shrink-0 text-[var(--pc-ink-2)]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{link.label}</span>
                      {(link.hint ?? link.detail) && <span className={cn(mono, "block truncate text-[11.5px] text-[var(--pc-ink-3)]")}>{link.hint ?? link.detail}</span>}
                    </span>
                    <ArrowUpRight aria-hidden className="size-4 shrink-0 text-[var(--pc-ink-3)] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--pc-accent)]" />
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </section>
        )}

        {m.social.length > 0 && (
          <ul className="pc-inview mt-8 flex flex-wrap gap-2">
            {m.social.map((link) => (
              <li key={link.id}>
                <TrackedLink href={link.href} profileId={profile.id} action="LINK" linkId={link.id} preview={preview} external={link.external} ariaLabel={link.label} className="flex size-11 items-center justify-center rounded-[10px] border border-[var(--pc-line)] hover:border-[var(--pc-accent)]">
                  <BrandIcon name={link.icon ?? link.type} className="size-[17px]" />
                </TrackedLink>
              </li>
            ))}
          </ul>
        )}

        {m.place && m.mapHref && (
          <TrackedLink href={m.mapHref} profileId={profile.id} action="DIRECTIONS" preview={preview} external className="pc-inview mt-8 flex items-center justify-between gap-3 border-t border-[var(--pc-line)] pt-4 text-[13.5px]">
            <span className="min-w-0 truncate text-[var(--pc-ink-2)]">{m.place}</span>
            <span className="flex shrink-0 items-center gap-1 font-medium">
              Itinéraire
              <ArrowUpRight aria-hidden className="size-3.5 text-[var(--pc-accent)]" />
            </span>
          </TrackedLink>
        )}

        <footer className={cn(mono, "mt-12 flex items-center justify-between border-t border-[var(--pc-line)] pt-4 text-[11.5px] text-[var(--pc-ink-3)]")}>
          <span>Carte NFC · Tap</span>
          <ShareControl url={profile.canonicalUrl} title={identity.displayName} profileId={profile.id} preview={preview} showLabel label="Partager" className="h-9 rounded-[8px] px-2 text-[var(--pc-ink)]" />
        </footer>
      </div>
    </main>
  );
}
