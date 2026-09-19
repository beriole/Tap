import { ArrowUpRight, UserRoundPlus } from "lucide-react";
import { Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { immersiveDisplay } from "./premium/font-immersive";
import { buildCardModel } from "./premium/model";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * IMMERSIVE - Visual · Creative · Bold.
 *
 * Le parti pris : un generique de film. La photo occupe tout le premier
 * ecran ; le nom s y pose en tres grand, prenom et nom sur deux lignes, et
 * le contact tient sur la photo meme - un bouton, puis trois mots separes
 * par des filets. Aucun panneau, aucun verre : la photo n est jamais
 * recouverte par autre chose qu un degrade.
 *
 * En dessous, la page se lit comme la suite du generique : une phrase en
 * grand, un second plan de la photo recadre en format cinema qui derive au
 * defilement (la destination principale), puis les liens numerotes comme
 * des credits, les reseaux en colonnes de texte.
 *
 * Lisibilite sur n importe quelle photo : un degrade bas assez dense pour
 * un texte blanc (noir a 90 % sous le bouton), un voile haut pour le partage.
 *
 * Variantes : Glass et Dark (fond noir, la photo s y fond), Clean et
 * Editorial (fond clair, la photo s arrete net comme un tirage).
 */
export function ThemeImmersive({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "immersive");
  const { identity } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const photo = identity.avatarUrl ?? identity.coverUrl;
  const variant = m.variant.key;
  const light = variant === "clean" || variant === "editorial";

  // Le second plan : la couverture si elle existe, sinon la photo recadree.
  const still = identity.avatarUrl && identity.coverUrl ? identity.coverUrl : photo;
  const rest = m.destinations.filter((d) => d.id !== m.featured?.id);

  // Le nom se regle sur son mot le plus long : un nom court s affiche en
  // tres grand, un nom compose ne deborde jamais.
  const longest = Math.max(...m.name.full.split(/\s+/).map((w) => w.length));
  const nameSize =
    longest > 11 ? "text-[clamp(38px,11vw,54px)]" : longest > 7 ? "text-[clamp(50px,14.5vw,68px)]" : "text-[clamp(62px,19vw,86px)]";

  // Sur la photo, le bouton reste clair ; sur une variante claire, il prend
  // le papier de la page.
  const onPhotoCta = light
    ? "bg-[var(--pc-bg)] text-[var(--pc-ink)]"
    : "bg-[var(--pc-cta)] text-[var(--pc-cta-ink)]";

  return (
    <main
      style={m.style}
      className={cn(immersiveDisplay.variable, "min-h-dvh overflow-x-clip bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased")}
    >
      <div className="mx-auto w-full max-w-[480px]">
        {/* ------------------------------------------------------- Plan 1 */}
        <section className="relative flex h-[max(100svh,640px)] max-h-[920px] flex-col justify-end overflow-hidden bg-[#0d0d0f] text-white">
          <div className="pc-settle absolute inset-0">
            <Portrait
              src={photo}
              alt={identity.displayName}
              sizes="(max-width: 480px) 100vw, 480px"
              position={m.photoPosition}
              className="size-full"
              fallback={<Poster initials={m.name.initials} />}
            />
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-28"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%]"
            style={{
              background: light
                ? "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.25) 70%, transparent 100%)"
                : "linear-gradient(to top, var(--pc-bg) 0%, rgba(0,0,0,0.78) 36%, rgba(0,0,0,0.25) 70%, transparent 100%)",
            }}
          />

          {/* Bandeau haut : un intitule de generique, le partage. */}
          <div className="absolute inset-x-0 top-[max(10px,env(safe-area-inset-top))] flex items-center justify-between gap-4 pl-5 pr-3">
            <p
              className="pc-fade min-w-0 truncate text-[11.5px] font-semibold uppercase tracking-[0.24em] text-white"
              style={{ "--d": "200ms" } as React.CSSProperties}
            >
              {m.region ?? identity.company ?? ""}
            </p>
            <ShareControl
              url={profile.canonicalUrl}
              title={identity.displayName}
              profileId={profile.id}
              preview={preview}
              className="pc-fade size-11 shrink-0 rounded-full bg-black/30 text-white"
            />
          </div>

          <div className="relative px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
            {m.availability && (
              <p
                className="pc-rise mb-4 flex items-center gap-2.5 text-[13px] font-medium text-white/90"
                style={{ "--d": "160ms" } as React.CSSProperties}
              >
                <span aria-hidden className="h-px w-6 bg-white/70" />
                <span className="line-clamp-1">{m.availability}</span>
              </p>
            )}
            <Name
              className={cn(
                nameSize,
                "pc-rise font-[family-name:var(--pc-display)] font-extrabold leading-[0.86] tracking-[-0.055em] [overflow-wrap:anywhere]",
              )}
              style={{ "--d": "200ms" } as React.CSSProperties}
            >
              {m.name.first}
              {m.name.last && (
                <>
                  <br />
                  {m.name.last}
                </>
              )}
            </Name>
            {(identity.title || identity.company) && (
              <p
                className="pc-rise mt-4 max-w-[34ch] text-[15px] leading-[1.4] text-white/90 [text-wrap:balance]"
                style={{ "--d": "260ms" } as React.CSSProperties}
              >
                {identity.title}
                {identity.title && identity.company && <span className="text-white/60"> — </span>}
                {identity.company && <span className="font-semibold text-white">{identity.company}</span>}
              </p>
            )}

            <div className="pc-rise mt-6" style={{ "--d": "320ms" } as React.CSSProperties}>
              <SaveContact
                token={profile.cardToken}
                profileId={profile.id}
                name={identity.displayName}
                preview={preview}
                icon={<UserRoundPlus className="size-[18px]" strokeWidth={2} />}
                className={cn("h-[54px] w-full rounded-[var(--pc-radius)] text-[15px] font-semibold tracking-[-0.01em]", onPhotoCta)}
              />
            </div>
            {m.actions.length > 0 && (
              <nav
                aria-label="Contacter"
                className="pc-rise mt-2 flex"
                style={{ "--d": "360ms" } as React.CSSProperties}
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
                      "flex h-12 flex-1 items-center justify-center text-[14px] font-semibold text-white hover:bg-white/10",
                      i > 0 && "border-l border-white/25",
                    )}
                  >
                    {a.label}
                  </TrackedLink>
                ))}
              </nav>
            )}
          </div>
        </section>

        {/* ------------------------------------------------ Suite du film */}
        <div className="px-5 pb-12 pt-14">
          {intro && (
            <p className="pc-inview font-[family-name:var(--pc-display)] text-[clamp(22px,6.4vw,27px)] font-semibold leading-[1.22] tracking-[-0.025em] [text-wrap:pretty]">
              {intro}
            </p>
          )}

          {/* Le second plan : la destination principale, en format cinema. */}
          {m.featured && (
            <TrackedLink
              href={m.featured.href}
              profileId={profile.id}
              action="LINK"
              linkId={m.featured.id.startsWith("profile-") ? null : m.featured.id}
              preview={preview}
              external={m.featured.external}
              className={cn("pc-inview group -mx-5 block", intro ? "mt-14" : "mt-0")}
            >
              <div className="relative aspect-[2.1/1] overflow-hidden bg-[#111]">
                {still ? (
                  <div className="pc-parallax absolute inset-0">
                    <Portrait
                      src={still}
                      alt=""
                      sizes="(max-width: 480px) 100vw, 480px"
                      position={still === photo ? "50% 30%" : "50% 50%"}
                      priority={false}
                      className="size-full"
                      fallback={null}
                    />
                  </div>
                ) : (
                  <Poster initials={m.name.initials} />
                )}
              </div>
              <div className="flex items-end justify-between gap-4 px-5 pt-4">
                <span className="min-w-0">
                  <span className="block text-[11.5px] font-semibold uppercase tracking-[0.24em] text-[var(--pc-ink-2)]">
                    {m.featured.description ?? m.featured.kind}
                  </span>
                  <span className="mt-1.5 block font-[family-name:var(--pc-display)] text-[26px] font-bold leading-[1.05] tracking-[-0.03em]">
                    {m.featured.label}
                  </span>
                </span>
                <ArrowUpRight
                  aria-hidden
                  className="mb-1 size-6 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  strokeWidth={1.75}
                />
              </div>
            </TrackedLink>
          )}

          {/* Credits : les autres destinations. */}
          {(rest.length > 0 || (m.place && m.mapHref)) && (
            <section className="mt-14">
              <Label>À découvrir</Label>
              <ol className="mt-3 border-t border-[var(--pc-line)]">
                {rest.map((link, i) => (
                  <li key={link.id} className="pc-inview border-b border-[var(--pc-line)]">
                    <TrackedLink
                      href={link.href}
                      profileId={profile.id}
                      action="LINK"
                      linkId={link.id.startsWith("profile-") ? null : link.id}
                      preview={preview}
                      external={link.external}
                      className="group flex min-h-[68px] items-center gap-4 py-3"
                    >
                      <span aria-hidden className="w-6 shrink-0 text-[12px] font-semibold tabular-nums text-[var(--pc-ink-2)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-[family-name:var(--pc-display)] text-[21px] font-bold tracking-[-0.03em]">
                          {link.label}
                        </span>
                        {link.detail && (
                          <span className="block truncate text-[13px] text-[var(--pc-ink-2)]">{link.detail}</span>
                        )}
                      </span>
                      <ArrowUpRight
                        aria-hidden
                        className="size-[18px] shrink-0 text-[var(--pc-ink-2)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </TrackedLink>
                  </li>
                ))}
                {m.place && m.mapHref && (
                  <li className="pc-inview border-b border-[var(--pc-line)]">
                    <TrackedLink
                      href={m.mapHref}
                      profileId={profile.id}
                      action="DIRECTIONS"
                      preview={preview}
                      external
                      className="group flex min-h-[68px] items-center gap-4 py-3"
                    >
                      <span aria-hidden className="w-6 shrink-0 text-[12px] font-semibold tabular-nums text-[var(--pc-ink-2)]">
                        {String(rest.length + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-[family-name:var(--pc-display)] text-[21px] font-bold tracking-[-0.03em]">
                          {m.place}
                        </span>
                        <span className="block truncate text-[13px] text-[var(--pc-ink-2)]">
                          Itinéraire{profile.location.country ? ` · ${profile.location.country}` : ""}
                        </span>
                      </span>
                      <ArrowUpRight aria-hidden className="size-[18px] shrink-0 text-[var(--pc-ink-2)]" />
                    </TrackedLink>
                  </li>
                )}
              </ol>
            </section>
          )}

          {m.social.length > 0 && (
            <nav aria-label="Réseaux" className="pc-inview mt-12">
              <Label>Suivre</Label>
              <ul className="mt-3 grid grid-cols-2 gap-x-5">
                {m.social.map((link) => (
                  <li key={link.id} className="border-t border-[var(--pc-line)]">
                    <TrackedLink
                      href={link.href}
                      profileId={profile.id}
                      action="LINK"
                      linkId={link.id}
                      preview={preview}
                      external={link.external}
                      className="group flex min-h-[60px] flex-col justify-center py-2"
                    >
                      <span className="flex items-center justify-between gap-2 text-[16px] font-semibold tracking-[-0.01em]">
                        {link.label}
                        <ArrowUpRight aria-hidden className="size-[14px] shrink-0 text-[var(--pc-ink-2)]" />
                      </span>
                      {link.hint && <span className="truncate text-[12.5px] text-[var(--pc-ink-2)]">{link.hint}</span>}
                    </TrackedLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Carton de fin. */}
          <footer className="mt-16 border-t border-[var(--pc-line)] pt-6">
            <p aria-hidden className="font-[family-name:var(--pc-display)] text-[40px] font-extrabold leading-[0.9] tracking-[-0.055em]">
              {m.name.full}
            </p>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-[12px] text-[var(--pc-ink-2)]">Carte NFC · Tap</span>
              <ShareControl
                url={profile.canonicalUrl}
                title={identity.displayName}
                profileId={profile.id}
                preview={preview}
                showLabel
                label="Partager"
                className="-mr-3 h-11 rounded-full px-3 text-[14px] font-semibold hover:bg-[var(--pc-press)]"
              />
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.24em] text-[var(--pc-ink-2)]">{children}</h2>
  );
}

/** Sans photo : une affiche typographique plutot qu un avatar gris. */
function Poster({ initials }: { initials: string }) {
  return (
    <div
      className="flex size-full items-center justify-center"
      style={{
        background:
          "radial-gradient(90% 70% at 30% 20%, color-mix(in srgb, var(--pc-accent) 30%, #2a2a2e), #0d0d0f 75%)",
      }}
    >
      <span className="font-[family-name:var(--pc-display)] text-[132px] font-extrabold leading-none tracking-[-0.06em] text-white/90">
        {initials}
      </span>
    </div>
  );
}
