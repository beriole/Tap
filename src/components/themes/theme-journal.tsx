import Image from "next/image";
import { ArrowUpRight, MapPin } from "lucide-react";
import { FlipCard, Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { journalDisplay } from "./premium/font-journal";
import { GRAIN } from "./premium/paper";
import { buildCardModel } from "./premium/model";
import { formatPhone, normalizePhone } from "@/lib/events/phone";
import { isValidCardToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * JOURNAL - Editorial · Narrative · Literary.
 *
 * Le parti pris : un titre de presse dont la personne est le sujet unique.
 * La carte a deux faces, imprimees sur un papier journal a grain :
 *  - recto : la une. Le nom compose en manchette, comme le titre d un
 *    magazine ; sous le double filet, la ligne de folio (fonction, ville),
 *    puis la photo d ouverture tramee et un chapeau ouvert par une lettrine ;
 *  - verso : l ours. Les coordonnees posees comme les mentions legales d un
 *    journal - rubrique en petites capitales, valeur en serif - et le QR en
 *    guise d edition en ligne.
 *
 * Aucune fausse date, aucun faux numero : chaque element typographique porte
 * une vraie information du profil. Sous la carte, la page se lit comme un
 * article : chapeau, lettrine, citation, sommaire a points de conduite.
 */
export function ThemeJournal({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "journal");
  const { identity, location, contact } = profile;
  const Name = preview ? "p" : "h1";
  const bio = identity.bio;
  const quote = identity.tagline;
  const token = profile.cardToken;
  const qrReady = !preview && isValidCardToken(token);
  const dark = m.variant.tokens.scheme === "dark";
  const caps = "text-[max(8.5px,2.45cqw)] font-semibold uppercase tracking-[0.16em]";

  const ours = [
    ["Téléphone", (contact.phone && formatPhone(normalizePhone(contact.phone).e164)) || contact.phone],
    ["Courriel", contact.email],
    ["En ligne", contact.website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") ?? null],
    ["Adresse", m.place ?? m.region],
  ].filter((f): f is [string, string] => Boolean(f[1]));

  // La manchette tient sur une ligne : sa taille se regle sur la longueur du nom.
  const mastSize = `min(11.5cqw, ${(90 / (m.name.full.length * 0.46)).toFixed(2)}cqw)`;
  // Le chapeau de la une : la citation du profil, a defaut la societe.
  const headline = quote ?? identity.company;
  // La signature en pied de colonne : une vraie information, jamais un faux folio.
  const byline = m.availability ?? m.region;

  const face = cn(
    "@container relative flex size-full flex-col overflow-hidden rounded-[3px] px-[4.6cqw] py-[4cqw] text-[var(--pc-ink)]",
    dark
      ? "bg-[#1E1C19] shadow-[0_0_0_1px_rgba(237,230,218,0.08),0_28px_56px_-30px_rgba(0,0,0,0.95)]"
      : "bg-[#FAF6EE] shadow-[0_0_0_1px_rgba(26,23,20,0.07),0_1px_2px_rgba(26,23,20,0.06),0_26px_50px_-30px_rgba(60,40,20,0.5)]",
  );
  const grain = (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", dark ? "opacity-[0.1] mix-blend-screen" : "opacity-[0.22] mix-blend-multiply")}
      style={{ backgroundImage: GRAIN }}
    />
  );
  // Double filet de presse : un gras, un maigre.
  const doubleRule = (
    <div aria-hidden>
      <div className="h-[2px] bg-[var(--pc-ink)]" />
      <div className="mt-[2px] h-px bg-[var(--pc-ink)]" />
    </div>
  );

  return (
    <main
      style={m.style}
      className={cn(journalDisplay.variable, "min-h-dvh bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased")}
    >
      <div className="mx-auto w-full max-w-[460px] px-5 pb-14 pt-[max(12px,env(safe-area-inset-top))] md:pt-10">
        <header className="pc-fade flex h-12 items-center justify-between" style={{ "--d": "0ms" } as React.CSSProperties}>
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--pc-ink-2)]">
            {m.region ?? "Portrait"}
          </span>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            className="-mr-2 size-11 text-[var(--pc-ink-2)] hover:bg-[var(--pc-press)]"
          />
        </header>

        <section className="pc-lift mt-3" style={{ "--d": "100ms" } as React.CSSProperties}>
          <FlipCard
            className="aspect-[85/55] rounded-[3px]"
            front={
              <div className={face}>
                {grain}
                <div className="relative flex min-h-0 flex-1 flex-col">
                  <Name
                    className="-mt-[0.08em] text-center font-[family-name:var(--pc-display)] font-medium leading-[1.02] tracking-[-0.025em] whitespace-nowrap"
                    style={{ fontSize: mastSize }}
                  >
                    {m.name.first}
                    {m.name.last && <span className="italic"> {m.name.last}</span>}
                  </Name>
                  <div className="mt-[1.2cqw]">{doubleRule}</div>
                  <div className={cn(caps, "flex justify-between gap-3 border-b border-[var(--pc-ink)] py-[1cqw]")}>
                    <span className="truncate">{identity.title ?? identity.company ?? "Portrait"}</span>
                    {location.city && <span className="shrink-0">{location.city}</span>}
                  </div>

                  <div className="mt-[2.6cqw] grid min-h-0 flex-1 grid-cols-[36%_1fr] gap-[3.4cqw]">
                    {/* Photo d ouverture, tramee comme une impression offset. */}
                    <div className="relative min-h-0 overflow-hidden bg-[var(--pc-surface)]">
                      <Portrait
                        src={identity.avatarUrl}
                        alt=""
                        sizes="140px"
                        position={m.photoPosition}
                        className="size-full"
                        imageClassName="grayscale contrast-[1.12] sepia-[0.12]"
                        fallback={
                          <div className="flex size-full items-center justify-center font-[family-name:var(--pc-display)] text-[16cqw] italic leading-none text-[var(--pc-ink-2)]">
                            {m.name.initials}
                          </div>
                        }
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-[0.28] mix-blend-multiply"
                        style={{
                          backgroundImage: "radial-gradient(rgba(0,0,0,0.9) 0.6px, transparent 1.1px)",
                          backgroundSize: "3px 3px",
                        }}
                      />
                    </div>
                    <div className="flex min-h-0 min-w-0 flex-col">
                      {headline && (
                        <p className="line-clamp-2 font-[family-name:var(--pc-display)] text-[max(13px,4.3cqw)] italic leading-[1.08] tracking-[-0.01em]">
                          {headline}
                        </p>
                      )}
                      {bio && (
                        <p
                          className="mt-[1.6cqw] min-h-0 flex-1 overflow-hidden text-pretty font-[family-name:var(--pc-display)] text-[max(9.5px,3.05cqw)] leading-[1.3] text-[var(--pc-ink-2)] [hyphens:auto] first-letter:float-left first-letter:mr-[0.08em] first-letter:mt-[0.06em] first-letter:text-[3.3em] first-letter:font-medium first-letter:leading-[0.8] first-letter:text-[var(--pc-accent)]"
                          lang="fr"
                        >
                          {bio}
                        </p>
                      )}
                      {byline && (
                        <p className={cn(caps, "mt-auto truncate border-t border-[var(--pc-line)] pt-[1.2cqw] text-[var(--pc-ink-2)]")}>
                          {byline}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            }
            back={
              <div className={face}>
                {grain}
                <div className="relative flex min-h-0 flex-1 flex-col">
                  {doubleRule}
                  <div className="flex items-baseline justify-between gap-3 border-b border-[var(--pc-line)] pb-[1.6cqw] pt-[1.8cqw]">
                    <p className="min-w-0 truncate font-[family-name:var(--pc-display)] text-[max(17px,6.2cqw)] font-medium leading-[1.15] tracking-[-0.02em]">
                      {m.name.full}
                    </p>
                    <p className={cn(caps, "shrink-0 text-[var(--pc-accent)]")}>Ours</p>
                  </div>
                  <div className="flex min-h-0 flex-1 gap-[4cqw] pt-[2.4cqw]">
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      {identity.title && (
                        <p className="line-clamp-2 font-[family-name:var(--pc-display)] text-[max(11.5px,3.8cqw)] italic leading-[1.2] text-[var(--pc-ink-2)]">
                          {identity.title}
                          {identity.company ? `, ${identity.company}` : ""}
                        </p>
                      )}
                      <dl className="space-y-[1.3cqw]">
                        {ours.map(([key, value]) => (
                          <div key={key} className="grid grid-cols-[21cqw_1fr] items-baseline">
                            <dt className={cn(caps, "text-[var(--pc-ink-2)]")}>{key}</dt>
                            <dd className="min-w-0 truncate font-[family-name:var(--pc-display)] text-[max(11px,3.5cqw)] leading-[1.3]">
                              {value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    {qrReady && (
                      <div className="flex shrink-0 flex-col items-center justify-end">
                        <span className="block size-[18cqw] bg-white p-[0.8cqw]">
                          <Image src={`/api/qr/${token}`} alt="" width={64} height={64} unoptimized className="size-full" />
                        </span>
                        <span className="mt-[1cqw] font-[family-name:var(--pc-display)] text-[max(9px,2.6cqw)] italic text-[var(--pc-ink-2)]">
                          Édition en ligne
                        </span>
                      </div>
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
            className="h-[52px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] text-[14px] font-medium uppercase tracking-[0.14em] text-[var(--pc-cta-ink)]"
          />
        </div>

        {m.actions.length > 0 && (
          <nav
            aria-label="Contacter"
            className="pc-rise mt-2 flex items-stretch justify-center divide-x divide-[var(--pc-line)] border-b border-[var(--pc-line)]"
            style={{ "--d": "290ms" } as React.CSSProperties}
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
                className="flex min-h-12 flex-1 items-center justify-center font-[family-name:var(--pc-display)] text-[17px] italic underline-offset-4 hover:underline"
              >
                {a.label}
              </TrackedLink>
            ))}
          </nav>
        )}

        {/* L article : rubrique, titre, chapeau a lettrine. */}
        {(bio || identity.title) && (
          <article className="pc-inview mt-12">
            <Rubric>Portrait</Rubric>
            {identity.title && (
              <p className="mt-5 text-center font-[family-name:var(--pc-display)] text-[27px] font-medium leading-[1.1] tracking-[-0.02em]">
                {identity.title}
                {identity.company && (
                  <span className="block italic text-[var(--pc-ink-2)]">{identity.company}</span>
                )}
              </p>
            )}
            {m.availability && (
              <p className="mt-3 text-center text-[11.5px] font-medium uppercase tracking-[0.2em] text-[var(--pc-accent)]">
                {m.availability}
              </p>
            )}
            {bio && (
              <p className="mt-7 text-[16.5px] leading-[1.62] first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-[family-name:var(--pc-display)] first-letter:text-[62px] first-letter:font-medium first-letter:leading-[0.8] first-letter:text-[var(--pc-accent)]">
                {bio}
              </p>
            )}
          </article>
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
          <section className="mt-11">
            <Rubric>Sommaire</Rubric>
            <ol className="mt-3">
              {m.destinations.map((link, i) => (
                <li key={link.id} className="pc-inview">
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id.startsWith("profile-") ? null : link.id}
                    preview={preview}
                    external={link.external}
                    className="group flex min-h-12 items-baseline gap-3 py-3"
                  >
                    <span className="w-5 shrink-0 font-[family-name:var(--pc-display)] text-[15px] italic text-[var(--pc-accent)]">
                      {i + 1}.
                    </span>
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
            <p className="mt-2 font-[family-name:var(--pc-display)] text-[18px] italic leading-relaxed">
              {m.social.map((link, i) => (
                <span key={link.id}>
                  {i > 0 && <span className="mx-1 not-italic text-[var(--pc-accent)]">·</span>}
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id}
                    preview={preview}
                    external={link.external}
                    className="inline-flex min-h-11 items-center px-1 underline decoration-[var(--pc-line)] underline-offset-4 hover:decoration-[var(--pc-accent)]"
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
              <span className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--pc-accent)]">
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
          <div className="flex items-center justify-between pt-2">
            <span className="font-[family-name:var(--pc-display)] text-[14px] italic text-[var(--pc-ink-2)]">Carte NFC · Tap</span>
            <ShareControl
              url={profile.canonicalUrl}
              title={identity.displayName}
              profileId={profile.id}
              preview={preview}
              showLabel
              label="Partager"
              className="h-11 text-[12px] font-medium uppercase tracking-[0.16em]"
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
