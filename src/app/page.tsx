import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { CardObject, PhoneFrame, RippleArcs } from "@/components/marketing/phone";
import { ThemeRenderer } from "@/components/themes/theme-renderer";
import { demoProfile } from "@/config/demo-profile";
import { THEMES } from "@/config/themes";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} - Cartes de visite NFC`,
  description: siteConfig.description,
};

/** Les trois temps du geste, dans l ordre ou ils se produisent reellement. */
const BEATS = [
  {
    time: "0 s",
    title: "Approcher",
    body: "La carte touche le telephone. Aucune application a installer, aucun compte a creer pour le visiteur.",
  },
  {
    time: "1 s",
    title: "Decouvrir",
    body: "Le profil s ouvre dans le navigateur : photo, poste, coordonnees, liens, localisation.",
  },
  {
    time: "3 s",
    title: "Enregistrer",
    body: "Un bouton, et la fiche entre dans le carnet d adresses du visiteur. La rencontre ne se perd plus.",
  },
];

export default function HomePage() {
  const profile = demoProfile("aurora");

  return (
    <div className="min-h-dvh bg-[var(--brand-ink)] text-[var(--brand-paper)]">
      <header className="app-shell flex items-center justify-between py-6">
        <Wordmark />
        <Link
          href="/login"
          className="rounded-full border border-white/15 px-5 py-2.5 text-[0.85rem] font-medium transition-colors hover:border-white/40"
        >
          Espace client
        </Link>
      </header>

      {/* ---------------------------------------------------------------- Heros */}
      <section className="relative overflow-hidden pb-24 pt-10 sm:pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 45% at 18% 8%, rgba(217,142,90,0.18) 0%, transparent 68%), radial-gradient(50% 45% at 88% 60%, rgba(125,211,252,0.10) 0%, transparent 70%)",
          }}
        />
        <div className="grain opacity-[0.06]" aria-hidden />

        <div className="app-shell relative grid items-center gap-14 lg:grid-cols-[1fr_auto]">
          <div className="max-w-xl">
            <p className="eyebrow text-[var(--brand-copper)]">Carte NFC + profil vivant</p>

            <h1 className="mt-5 font-[family-name:var(--font-grotesk)] text-[clamp(2.4rem,1.6rem+3.6vw,4rem)] font-extrabold leading-[0.98] tracking-[-0.04em]">
              Une carte.
              <br />
              Un profil qui
              <br />
              <span className="text-[var(--brand-copper)]">ne vieillit jamais.</span>
            </h1>

            <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-white/55">
              La puce ne contient qu une adresse courte et definitive. Vous changez de poste, de
              numero, de photo : le profil suit, la carte reste la meme.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="group tap-target rounded-xl bg-[var(--brand-copper)] px-6 font-semibold text-[#231206] transition-colors hover:bg-[#e5a070]"
              >
                Acceder a mon espace
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#themes"
                className="tap-target px-2 text-[0.9rem] text-white/60 underline-offset-4 hover:text-white hover:underline"
              >
                Voir les 15 themes
              </Link>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[0.82rem] text-white/45">
              {["Sans application", "Compatible iPhone et Android", "QR Code de secours"].map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-[var(--brand-signal)]" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Le heros EST le produit : un vrai profil, rendu par les memes
              composants que ceux servis apres un scan. La carte est posee A COTE du telephone,
              jamais dessus : c est le signal qui traverse, pas l objet. */}
          <div className="relative mx-auto w-fit lg:mx-0 lg:pl-28">
            <PhoneFrame width={288} height={578}>
              <ThemeRenderer profile={profile} preview />
            </PhoneFrame>

            <div className="absolute -bottom-4 left-0 hidden -translate-x-[62%] rotate-[-10deg] lg:block">
              <CardObject />
              <RippleArcs className="absolute -right-6 top-1/2 size-16 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Le geste */}
      <section className="border-t border-[var(--brand-line)] py-20">
        <div className="app-shell">
          <p className="eyebrow text-white/35">Le geste</p>
          <h2 className="mt-4 max-w-lg font-[family-name:var(--font-grotesk)] text-[2rem] font-bold leading-[1.05] tracking-[-0.03em]">
            Trois secondes entre la poignee de main et le contact enregistre.
          </h2>

          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[var(--brand-line)] bg-[var(--brand-line)] md:grid-cols-3">
            {BEATS.map((beat) => (
              <li key={beat.title} className="bg-[var(--brand-ink)] p-7">
                <span className="eyebrow text-[var(--brand-signal)]">{beat.time}</span>
                <h3 className="mt-4 text-[1.15rem] font-semibold tracking-[-0.01em]">
                  {beat.title}
                </h3>
                <p className="mt-2.5 text-[0.9rem] leading-relaxed text-white/45">{beat.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------------------------------------- La promesse
          Premiere respiration : la page passe sur PAPIER.
          Tout garder sur le meme fond d encre rendait la lecture monotone et
          faisait paraitre chaque section identique a la precedente. Le papier
          est celui de l espace client : la vitrine et le produit se
          reconnaissent. */}
      <section className="relative overflow-hidden bg-[var(--console-paper)] py-24 text-[var(--brand-ink)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 85% 0%, rgba(217,142,90,0.16) 0%, transparent 70%)",
          }}
        />
        <div className="app-shell relative grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow text-[var(--brand-copper-deep)]">
              Ce qui est grave dans la puce
            </p>
            {/* L adresse gravee, montree comme un objet : c est la seule chose
                que contient la puce, elle merite un cadre.

                Bloc de largeur contrainte plutot qu une pastille ajustee au
                texte : un element qui se dimensionne sur son contenu s etait
                effondre a 32 px en laissant le texte deborder par-dessus le
                papier. Une largeur maximale ne peut pas s effondrer. */}
            <div className="mt-5 max-w-[22rem] overflow-hidden rounded-xl bg-[var(--brand-ink)] px-4 py-3">
              <code className="block truncate font-[family-name:var(--font-mono)] text-[1.05rem] tracking-tight text-[var(--brand-copper)] sm:text-[1.2rem]">
                tap.exemple/c/A7K2M9Q
              </code>
            </div>
            <h2 className="mt-6 font-[family-name:var(--font-display)] text-[clamp(1.9rem,1.4rem+1.8vw,2.6rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
              Cette adresse ne changera plus jamais.
            </h2>
            <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-[var(--muted)]">
              Tout le contenu vit sur le serveur. Reimprimer une carte parce qu un numero a change
              n a plus de sens : vous modifiez la fiche, la puce ne bouge pas.
            </p>
          </div>

          <dl className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[var(--brand-ink)]/12 bg-white shadow-[0_20px_60px_-40px_rgb(19_16_12/0.5)]">
            {[
              ["144", "octets dans la puce NTAG213"],
              ["0", "reecriture apres un changement"],
              ["15", "themes premium au choix"],
              ["1", "geste pour enregistrer le contact"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="border-b border-r border-[var(--brand-ink)]/10 p-7 last:border-r-0"
              >
                <dt className="console-figure text-[2.6rem] text-[var(--brand-copper-deep)]">
                  {value}
                </dt>
                <dd className="mt-2.5 text-[0.82rem] leading-snug text-[var(--muted)]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* --------------------------------------------- Les liens restreints */}
      <section className="relative overflow-hidden bg-[var(--console-paper)] pb-24 text-[var(--brand-ink)]">
        <div className="app-shell relative">
          <div className="rounded-3xl border border-[var(--brand-ink)]/12 bg-white p-8 sm:p-12">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <div>
                <p className="eyebrow text-[var(--brand-copper-deep)]">Liens restreints</p>
                <h2 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(1.7rem,1.3rem+1.5vw,2.3rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
                  On ne donne pas la meme chose a tout le monde.
                </h2>
                <p className="mt-4 max-w-lg text-[1rem] leading-relaxed text-[var(--muted)]">
                  Une ceremonie, un salon, un premier rendez-vous : la situation n appelle pas
                  toujours votre profil entier. Creez un lien qui n expose que ce que vous cochez,
                  avec son propre habillage. Vos donnees restent uniques — corriger votre numero
                  le corrige partout, y compris dans les liens deja distribues.
                </p>
              </div>

              {/* Trois exemples concrets valent mieux qu une explication : on
                  voit tout de suite que le curseur se deplace. */}
              <ul className="grid gap-3">
                {[
                  ["Ceremonie", "Nom, photo, telephone", 3],
                  ["Salon professionnel", "Fonction, entreprise, site, LinkedIn", 5],
                  ["Carte NFC", "Le profil entier", 12],
                ].map(([label, what, count], i) => (
                  <li
                    key={label as string}
                    className="flex items-center gap-4 rounded-xl border border-[var(--brand-ink)]/10 bg-[var(--console-paper)] p-4"
                  >
                    <span className="console-figure w-8 shrink-0 text-[1.5rem] text-[var(--brand-copper-deep)]">
                      {count}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.9rem] font-semibold">{label}</span>
                      <span className="block text-[0.8rem] text-[var(--muted)]">{what}</span>
                    </span>
                    {/* Une jauge qui se remplit : la quantite de soi que l on
                        accepte de donner, rendue visible. */}
                    <span
                      aria-hidden
                      className="ml-auto hidden h-1 w-20 shrink-0 overflow-hidden rounded-full bg-[var(--brand-ink)]/10 sm:block"
                    >
                      <span
                        className="block h-full rounded-full bg-[var(--brand-copper)]"
                        style={{ width: `${[25, 45, 100][i]}%` }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Themes */}
      <section id="themes" className="border-t border-[var(--brand-line)] py-20">
        <div className="app-shell">
          <p className="eyebrow text-white/35">La bibliotheque</p>
          <h2 className="mt-4 max-w-xl font-[family-name:var(--font-grotesk)] text-[2rem] font-bold leading-[1.05] tracking-[-0.03em]">
            Quinze directions artistiques. Un seul contenu.
          </h2>
          <p className="mt-4 max-w-lg text-[0.95rem] leading-relaxed text-white/45">
            Changer de theme ne perd ni une information ni un lien. Le client choisit, la structure
            ne bouge pas.
          </p>

          {/* Quinze cartes de texte gris avec une pastille de douze pixels
              disaient "quinze themes" sans jamais les MONTRER - alors que la
              couleur est precisement ce que le produit a de plus beau. Chaque
              carte porte maintenant l accent de son theme, en grand. */}
          <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((theme) => (
              <li
                key={theme.key}
                className="group relative overflow-hidden rounded-2xl border border-[var(--brand-line)] transition-all duration-300 hover:-translate-y-1 hover:border-white/25"
                style={{ ["--tint" as string]: theme.defaultAccent }}
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-full opacity-25 transition-opacity duration-300 group-hover:opacity-60"
                  style={{
                    background:
                      "radial-gradient(120% 80% at 50% -20%, var(--tint) 0%, transparent 62%)",
                  }}
                />
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[3px]"
                  style={{ background: theme.defaultAccent }}
                />
                <div className="relative p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="eyebrow text-white/30">{theme.code}</span>
                    <span
                      className="font-[family-name:var(--font-mono)] text-[0.68rem] uppercase tracking-[0.14em]"
                      style={{ color: theme.defaultAccent }}
                    >
                      {theme.mvp ? "Toutes offres" : "Premium"}
                    </span>
                  </div>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-[1.2rem] font-semibold tracking-[-0.01em]">
                    {theme.name}
                  </h3>
                  <p className="mt-2 text-[0.8rem] leading-relaxed text-white/45">{theme.target}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --------------------------------------------------------------- Pied */}
      <footer className="border-t border-[var(--brand-line)]">
        <div className="app-shell flex flex-col gap-8 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <LogoMark className="h-8 text-[var(--brand-paper)]" animated />
            <p className="mt-4 max-w-xs text-[0.85rem] leading-relaxed text-white/40">
              {siteConfig.tagline}
            </p>
          </div>
          <Link
            href="/login"
            className="tap-target w-fit rounded-xl border border-white/20 px-6 font-medium transition-colors hover:border-white/50"
          >
            Espace client
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
