import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { FlipCard, Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { swissDisplay } from "./premium/font-swiss";
import { buildCardModel } from "./premium/model";
import { formatPhone, normalizePhone } from "@/lib/events/phone";
import { isValidCardToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * SWISS - Grid · Typographic · Precise.
 *
 * Le parti pris : une affiche de graphisme suisse, imprimee au format carte.
 * Une grille de quatre colonnes, tracee en filets tres fins, gouverne les
 * deux faces ; chaque texte part d une de ses lignes.
 *  - recto : l affiche. Le nom compose tres grand, cale en pied, ferme par
 *    un point de couleur - le seul ornement de la carte. En tete, la societe
 *    et la fonction, chacune dans sa moitie de grille ;
 *  - verso : la fiche. Etiquettes mono dans la premiere colonne, valeurs
 *    dans les deux suivantes, le QR dans la derniere.
 *
 * Sous la carte, la page reprend la meme grille : etiquettes a gauche,
 * contenu a droite, la photo en noir et blanc en vignette de catalogue.
 * Aucun arrondi, aucune ombre de decor. La rigueur tient a l alignement.
 */
export function ThemeSwiss({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "swiss");
  const { identity, location, contact } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const token = profile.cardToken;
  const qrReady = !preview && isValidCardToken(token);
  const dark = m.variant.tokens.scheme === "dark";
  const mono = "font-[family-name:var(--font-mono)]";
  const label = cn(mono, "text-[10.5px] uppercase tracking-[0.12em] text-[var(--pc-ink-2)]");

  const fields = [
    ["Tél.", (contact.phone && formatPhone(normalizePhone(contact.phone).e164)) || contact.phone],
    ["E-mail", contact.email],
    ["Web", contact.website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") ?? null],
    ["Ville", [location.city, location.country].filter(Boolean).join(", ") || null],
  ].filter((f): f is [string, string] => Boolean(f[1]));

  // Le nom se regle sur son mot le plus long : il doit tenir dans la largeur
  // de la carte sans jamais etre coupe (0,5 em par signe, marge comprise).
  const longest = Math.max(m.name.first.length, (m.name.last?.length ?? 0) + 1);
  const nameSize = `min(17.5cqw, ${(92 / (longest * 0.5)).toFixed(2)}cqw)`;

  // Le papier de la carte : un blanc plus franc que la page, ou un noir
  // releve d un ton sur la variante Ink.
  const face = cn(
    "@container relative flex size-full overflow-hidden rounded-[3px] text-[var(--pc-ink)]",
    dark
      ? "bg-[#1A1A1A] shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_28px_56px_-30px_rgba(0,0,0,0.95)]"
      : "bg-[#FDFDFB] shadow-[0_0_0_1px_rgba(17,17,17,0.06),0_1px_2px_rgba(17,17,17,0.06),0_26px_50px_-30px_rgba(17,17,17,0.45)]",
  );
  // La grille de quatre colonnes, en filets : la meme sur les deux faces.
  // Au recto, les filets partent sous l en tete ; au verso, ils s effacent
  // avant la fiche pour ne pas barrer les valeurs.
  const grid = (side: "front" | "back") => (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-[5.5cqw] grid grid-cols-4",
        side === "front" ? "bottom-0 top-[17cqw]" : "inset-y-0",
      )}
      style={side === "back" ? { maskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 52%)" } : undefined}
    >
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={cn("border-[var(--pc-line)]", i > 0 && "border-l")} />
      ))}
    </div>
  );

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
          <span className={cn(mono, "text-[11px] uppercase tracking-[0.14em]")}>Carte de visite</span>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            className="-mr-2 size-11 text-[var(--pc-ink)] hover:bg-[var(--pc-press)]"
          />
        </header>

        <section className="pc-lift mt-7" style={{ "--d": "100ms" } as React.CSSProperties}>
          <FlipCard
            className="aspect-[85/55] rounded-[3px]"
            front={
              <div className={face}>
                {grid("front")}
                <div className="relative flex flex-1 flex-col justify-between px-[5.5cqw] pb-[4.2cqw] pt-[5cqw]">
                  {/* En tete : deux informations, chacune dans sa moitie de grille. */}
                  <div className="grid grid-cols-2 border-t border-[var(--pc-ink)] pt-[1.8cqw]">
                    <p className={cn(mono, "pr-2 text-[max(9px,2.7cqw)] uppercase leading-[1.35] tracking-[0.1em]")}>
                      {identity.company ?? m.region ?? " "}
                    </p>
                    <p className="line-clamp-2 pl-[1.6cqw] text-[max(9.5px,2.9cqw)] font-medium leading-[1.3] tracking-[-0.005em]">
                      {identity.title ?? m.region}
                    </p>
                  </div>
                  <Name
                    className="-mb-[0.1em] -ml-[0.04em] font-[family-name:var(--pc-display)] font-semibold leading-[0.84] tracking-[-0.055em]"
                    style={{ fontSize: nameSize }}
                  >
                    <span className="block">
                      {m.name.first}
                      {!m.name.last && <Dot />}
                    </span>
                    {m.name.last && (
                      <span className="block">
                        {m.name.last}
                        <Dot />
                      </span>
                    )}
                  </Name>
                </div>
              </div>
            }
            back={
              <div className={face}>
                {grid("back")}
                <div className="relative flex flex-1 flex-col justify-between px-[5.5cqw] pb-[5cqw] pt-[5cqw]">
                  <div className="grid grid-cols-4 border-t border-[var(--pc-ink)] pt-[1.8cqw]">
                    <p className="col-span-3 font-[family-name:var(--pc-display)] text-[max(14px,4.6cqw)] font-semibold leading-[1] tracking-[-0.035em]">
                      {m.name.full}
                      <Dot />
                    </p>
                    <p className={cn(mono, "pl-[1.6cqw] pt-[0.4cqw] text-[max(8.5px,2.5cqw)] uppercase leading-[1.3] tracking-[0.1em]")}>
                      {location.city ?? m.name.initials}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 items-end">
                    <dl className="col-span-3">
                      {fields.map(([key, value]) => (
                        <div key={key} className="grid grid-cols-3 border-t border-[var(--pc-line)] py-[1.1cqw]">
                          <dt className={cn(mono, "pt-[0.3cqw] text-[max(8.5px,2.5cqw)] uppercase tracking-[0.1em] text-[var(--pc-ink-2)]")}>
                            {key}
                          </dt>
                          <dd className="col-span-2 min-w-0 truncate pl-[1.6cqw] text-[max(10px,3.05cqw)] leading-[1.35] tracking-[-0.005em]">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {qrReady ? (
                      <span className="ml-auto block aspect-square w-[20cqw] bg-white p-[1cqw]">
                        <Image src={`/api/qr/${token}`} alt="" width={64} height={64} unoptimized className="size-full" />
                      </span>
                    ) : (
                      <span />
                    )}
                  </div>
                </div>
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
                  "flex h-[58px] items-center justify-between gap-2 px-3 text-[14px] font-medium",
                  i > 0 && "border-l border-[var(--pc-line)]",
                )}
              >
                <span className="truncate">{a.label}</span>
                <ActionIcon kind={a.kind} className="size-[16px] shrink-0 text-[var(--pc-ink-2)]" />
              </TrackedLink>
            ))}
          </nav>
        )}

        {/* Profil : la fonction en titre, la vignette noir et blanc calee a droite. */}
        <section className="pc-inview mt-12 border-t border-[var(--pc-ink)] pt-3">
          <div className="grid grid-cols-[1fr_92px] gap-4">
            <div className="min-w-0">
              <h2 className={label}>Profil</h2>
              {identity.title && (
                <p className="mt-3 font-[family-name:var(--pc-display)] text-[22px] font-semibold leading-[1.08] tracking-[-0.035em]">
                  {identity.title}
                </p>
              )}
              {identity.company && <p className="mt-2 text-[15px] leading-snug text-[var(--pc-ink-2)]">{identity.company}</p>}
            </div>
            <div className="relative h-[116px] w-[92px] overflow-hidden">
              <Portrait
                src={identity.avatarUrl}
                alt={identity.displayName}
                sizes="92px"
                position={m.photoPosition}
                priority={false}
                className="size-full bg-[var(--pc-surface)]"
                imageClassName="grayscale contrast-[1.08]"
                fallback={
                  <div className="flex size-full items-end bg-[var(--pc-surface)] p-2 font-[family-name:var(--pc-display)] text-[34px] font-semibold leading-[0.8] tracking-[-0.06em]">
                    {m.name.initials}
                    <Dot />
                  </div>
                }
              />
            </div>
          </div>
          {m.availability && (
            <p className="mt-5 flex items-start gap-2.5 border-t border-[var(--pc-line)] pt-3 text-[15px] leading-snug">
              <span aria-hidden className="mt-[6px] size-2 shrink-0 bg-[var(--pc-accent)]" />
              {m.availability}
            </p>
          )}
        </section>

        {intro && (
          <section className="pc-inview mt-10 grid grid-cols-[84px_1fr] gap-2">
            <h2 className={cn(label, "pt-1")}>À propos</h2>
            <p className="text-[16px] leading-[1.5] tracking-[-0.005em]">{intro}</p>
          </section>
        )}

        {m.destinations.length > 0 && (
          <section className="mt-12">
            <h2 className={cn(mono, "border-b border-[var(--pc-ink)] pb-2 text-[10.5px] uppercase tracking-[0.12em]")}>Index</h2>
            <ul>
              {m.destinations.map((link, i) => (
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
                    <span className={label}>
                      {String(i + 1).padStart(2, "0")} {link.kind}
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
                      className="size-4 translate-y-0.5 text-[var(--pc-ink)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0"
                    />
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </section>
        )}

        {m.social.length > 0 && (
          <section className="pc-inview mt-10 grid grid-cols-[84px_1fr] gap-2">
            <h2 className={cn(label, "pt-3")}>Réseaux</h2>
            <ul className="flex flex-wrap gap-x-4">
              {m.social.map((link) => (
                <li key={link.id}>
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id}
                    preview={preview}
                    external={link.external}
                    className="inline-flex min-h-11 items-center text-[15px] font-medium underline decoration-[var(--pc-line)] underline-offset-4 hover:decoration-[var(--pc-accent)]"
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
            <h2 className={cn(label, "pt-1")}>Adresse</h2>
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
              <span className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold">
                Itinéraire
                <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </TrackedLink>
          </section>
        )}

        <footer className={cn(mono, "mt-14 flex items-center justify-between border-t border-[var(--pc-ink)] pt-2 text-[10.5px] uppercase tracking-[0.12em] text-[var(--pc-ink-2)]")}>
          <span>Carte NFC</span>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            showLabel
            label="Partager"
            className="h-11 gap-1.5 uppercase text-[var(--pc-ink)]"
          />
        </footer>
      </div>
    </main>
  );
}

/** Le point de couleur qui ferme le nom : le seul ornement du design. */
function Dot() {
  return (
    <span aria-hidden className="text-[var(--pc-accent)]">
      .
    </span>
  );
}
