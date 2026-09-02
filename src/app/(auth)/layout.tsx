import Link from "next/link";
import { LogoMark, NfcWaves, Wordmark } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";

/**
 * Ecran d entree : encre a gauche, papier a droite.
 *
 * Le panneau sombre n est pas un decor. Il montre le geste du produit - une
 * carte, un signal qui part - pour que la premiere impression corresponde a ce
 * que le client vient acheter. Sur mobile il disparait : on ne fait pas defiler
 * une illustration avant d atteindre un champ de mot de passe.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-[var(--brand-paper)]">
      <aside className="relative hidden w-[46%] max-w-[34rem] flex-col justify-between overflow-hidden bg-[var(--brand-ink)] p-10 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 55% at 25% 12%, rgba(217,142,90,0.20) 0%, transparent 70%), radial-gradient(60% 50% at 85% 85%, rgba(125,211,252,0.12) 0%, transparent 72%)",
          }}
        />
        <div className="grain opacity-[0.07]" aria-hidden />

        <Link href="/" className="relative">
          <Wordmark />
        </Link>

        {/* La carte et son signal, a l echelle. */}
        <div className="relative flex flex-1 items-center justify-center">
          <div className="relative">
            <div className="h-44 w-72 rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a202c] to-[#0d1017] p-5 shadow-[var(--shadow-hero)]">
              <div className="eyebrow text-[var(--brand-copper)]">Carte NFC</div>
              <div className="mt-10 h-1.5 w-24 rounded-full bg-white/15" />
              <div className="mt-2.5 h-1.5 w-16 rounded-full bg-white/10" />
            </div>

            <NfcWaves
              animated
              strokeWidth={1.4}
              className="absolute -right-16 top-1/2 h-28 w-16 -translate-y-1/2 text-[var(--brand-signal)]"
            />
          </div>
        </div>

        <p className="relative max-w-xs text-[0.9rem] leading-relaxed text-white/45">
          {siteConfig.tagline} Une identite professionnelle qui se met a jour sans jamais
          reecrire la puce.
        </p>
      </aside>

      <main className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-[24rem]">
          <Link href="/" className="mb-10 inline-flex lg:hidden">
            <LogoMark className="h-8 text-[var(--brand-ink)]" lineColor="var(--brand-paper)" />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
