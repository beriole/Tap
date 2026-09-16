import { ArrowUpRight, Download } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { buildCardModel } from "./premium/model";
import type { ThemeProps } from "@/types/profile";

/**
 * TERMINAL - Tech · Precise · Developer.
 *
 * Le parti pris : la rigueur d un editeur de code, sans le costume. Pas de
 * faux boutons de fenetre, pas de texte vert fluo qui defile. Une invite qui
 * annonce le nom, une fiche en cles et valeurs alignees, des liens qui se
 * lisent comme des chemins. Le nom lui-meme reste en Geist, lisible : seules
 * les etiquettes parlent la langue du terminal.
 *
 * Seul clin d oeil anime : le curseur apres le nom clignote trois fois, puis
 * s arrete. Rien ne bouge en continu.
 *
 * Polices : Geist et Geist Mono, deja chargees par la plateforme.
 */
export function ThemeTerminal({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "terminal");
  const { identity, location, contact } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const slug = m.name.full.toLowerCase().normalize("NFD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

  const fields = [
    ["role", identity.title],
    ["company", identity.company],
    ["location", [location.city, location.country].filter(Boolean).join(", ") || null],
    ["email", contact.email],
  ].filter((f): f is [string, string] => Boolean(f[1]));

  return (
    <main style={m.style} className="min-h-dvh bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased">
      <div className="mx-auto w-full max-w-[460px] px-5 pb-14 pt-[max(12px,env(safe-area-inset-top))] md:pt-10">
        <header
          className="pc-fade flex h-12 items-center justify-between font-[family-name:var(--font-mono)] text-[12.5px] text-[var(--pc-ink-2)]"
          style={{ "--d": "0ms" } as React.CSSProperties}
        >
          <span className="truncate">~/cartes/{slug}</span>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            className="-mr-2 size-10 rounded-[10px] hover:bg-[var(--pc-press)]"
          />
        </header>

        <section className="mt-5 flex items-end gap-4">
          <div className="pc-unveil relative size-[76px] shrink-0 overflow-hidden rounded-[14px]">
            <Portrait
              src={identity.avatarUrl}
              alt={identity.displayName}
              sizes="76px"
              position={m.photoPosition}
              className="size-full bg-[var(--pc-surface)]"
              fallback={
                <div className="flex size-full items-center justify-center font-[family-name:var(--font-mono)] text-[22px] text-[var(--pc-accent)]">
                  {m.name.initials}
                </div>
              }
            />
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-[var(--pc-line)]" />
          </div>
          <div className="min-w-0">
            <p className="pc-rise font-[family-name:var(--font-mono)] text-[13px] text-[var(--pc-ink-2)]" style={{ "--d": "80ms" } as React.CSSProperties}>
              <span className="text-[var(--pc-accent)]">$</span> whoami
            </p>
            <Name
              className="pc-rise mt-1 text-[clamp(30px,9vw,38px)] font-semibold leading-[1.04] tracking-[-0.035em]"
              style={{ "--d": "130ms" } as React.CSSProperties}
            >
              {m.name.full}
              <span
                aria-hidden
                className="ml-1 inline-block h-[0.8em] w-[0.42em] translate-y-[0.1em] bg-[var(--pc-accent)] [animation:pc-caret_1s_steps(1)_3]"
              />
            </Name>
          </div>
        </section>

        {/* Fiche en cles et valeurs */}
        <dl
          className="pc-rise mt-6 rounded-[14px] border border-[var(--pc-line)] bg-[var(--pc-surface)] px-4 py-3 font-[family-name:var(--font-mono)] text-[13px]"
          style={{ "--d": "200ms" } as React.CSSProperties}
        >
          {fields.map(([key, value]) => (
            <div key={key} className="grid grid-cols-[82px_1fr] gap-2 py-1">
              <dt className="text-[var(--pc-ink-2)]">{key}</dt>
              <dd className="break-words text-[var(--pc-ink)]">
                <span className="text-[var(--pc-ink-3)]">&quot;</span>
                {value}
                <span className="text-[var(--pc-ink-3)]">&quot;</span>
              </dd>
            </div>
          ))}
          {m.availability && (
            <div className="grid grid-cols-[82px_1fr] gap-2 py-1">
              <dt className="text-[var(--pc-ink-2)]">status</dt>
              <dd className="flex items-start gap-2 text-[var(--pc-accent)]">
                <span aria-hidden className="mt-[5px] size-2 shrink-0 rounded-full bg-[var(--pc-accent)]" />
                {m.availability}
              </dd>
            </div>
          )}
        </dl>

        <div className="pc-rise mt-5" style={{ "--d": "260ms" } as React.CSSProperties}>
          <SaveContact
            token={profile.cardToken}
            profileId={profile.id}
            name={identity.displayName}
            preview={preview}
            icon={null}
            trailing={
              <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-black/10 px-2 py-1 font-[family-name:var(--font-mono)] text-[11.5px] font-medium">
                <Download aria-hidden className="size-3" />
                .vcf
              </span>
            }
            className="h-[54px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] px-5 text-[15px] font-semibold tracking-[-0.01em] text-[var(--pc-cta-ink)]"
          />
        </div>

        {m.actions.length > 0 && (
          <nav
            aria-label="Contacter"
            className="pc-rise mt-2.5 grid gap-2"
            style={
              { "--d": "310ms", gridTemplateColumns: `repeat(${m.actions.length}, minmax(0, 1fr))` } as React.CSSProperties
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
                className="flex h-[48px] items-center justify-center gap-2 rounded-[var(--pc-radius)] border border-[var(--pc-line)] font-[family-name:var(--font-mono)] text-[12.5px] hover:border-[var(--pc-accent)]"
              >
                <ActionIcon kind={a.kind} className="size-[15px] text-[var(--pc-accent)]" />
                {a.label.toLowerCase()}
              </TrackedLink>
            ))}
          </nav>
        )}

        {intro && (
          <section className="pc-inview mt-10">
            <p className="font-[family-name:var(--font-mono)] text-[12.5px] text-[var(--pc-ink-3)]">{"/* à propos */"}</p>
            <p className="mt-2 text-[15.5px] leading-[1.65] text-[var(--pc-ink-2)]">{intro}</p>
          </section>
        )}

        {m.destinations.length > 0 && (
          <section className="mt-10">
            <p className="font-[family-name:var(--font-mono)] text-[12.5px] text-[var(--pc-ink-3)]">{"/* liens */"}</p>
            <ul className="mt-2">
              {m.destinations.map((link) => (
                <li key={link.id} className="pc-inview border-b border-[var(--pc-line)]">
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id.startsWith("profile-") ? null : link.id}
                    preview={preview}
                    external={link.external}
                    className="group -mx-2 flex items-center gap-3 rounded-[10px] px-2 py-3.5"
                  >
                    <span aria-hidden className="font-[family-name:var(--font-mono)] text-[14px] text-[var(--pc-accent)] transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15.5px] font-medium">{link.label}</span>
                      {(link.hint ?? link.detail) && (
                        <span className="block truncate font-[family-name:var(--font-mono)] text-[12px] text-[var(--pc-ink-2)]">
                          {link.hint ?? link.detail}
                        </span>
                      )}
                    </span>
                    <ArrowUpRight aria-hidden className="size-4 shrink-0 text-[var(--pc-ink-3)]" />
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </section>
        )}

        {m.social.length > 0 && (
          <ul className="pc-inview mt-8 grid grid-cols-2 gap-2">
            {m.social.map((link) => (
              <li key={link.id}>
                <TrackedLink
                  href={link.href}
                  profileId={profile.id}
                  action="LINK"
                  linkId={link.id}
                  preview={preview}
                  external={link.external}
                  className="flex h-11 items-center gap-2.5 rounded-[10px] bg-[var(--pc-surface)] px-3 font-[family-name:var(--font-mono)] text-[12.5px]"
                >
                  <BrandIcon name={link.icon ?? link.type} className="size-[16px] shrink-0" />
                  <span className="truncate">{link.hint ?? link.label}</span>
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
            className="pc-inview mt-8 flex items-center justify-between gap-3 font-[family-name:var(--font-mono)] text-[13px]"
          >
            <span className="min-w-0 truncate text-[var(--pc-ink-2)]">{"// "}{m.place}</span>
            <span className="shrink-0 text-[var(--pc-accent)]">itinéraire →</span>
          </TrackedLink>
        )}

        <footer className="mt-12 flex items-center justify-between border-t border-[var(--pc-line)] pt-4 font-[family-name:var(--font-mono)] text-[12px] text-[var(--pc-ink-3)]">
          <span>carte nfc · tap</span>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            showLabel
            label="partager"
            className="h-9 rounded-[8px] px-2 text-[var(--pc-ink)]"
          />
        </footer>
      </div>
    </main>
  );
}
