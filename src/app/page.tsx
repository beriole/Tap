import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { EnvelopeScene } from "@/components/marketing/envelope-scene";
import { PhoneFrame, RippleArcs } from "@/components/marketing/phone";
import { ScrollScenes } from "@/components/marketing/scroll-scenes";
import { ThemeRenderer } from "@/components/themes/theme-renderer";
import { demoProfile } from "@/config/demo-profile";
import { COLLECTION_LABELS, themesOf, type InvitationCollection } from "@/config/invitation-themes";
import { FAMILIES, PREMIUM_ENGINES } from "@/config/premium-themes";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import type { PublicProfile } from "@/types/profile";

export const metadata: Metadata = {
  title: `${siteConfig.name} - Cartes NFC, invitations et événements`,
  description: siteConfig.description,
};

/**
 * LA VITRINE.
 *
 * Le parti pris : montrer l objet avant d expliquer le produit. Le heros est
 * une scene a trois profondeurs (lumiere, pli, telephone) qui glissent a des
 * vitesses differentes au defilement ; puis le pli s ouvre SOUS le doigt du
 * lecteur - la scene suit la position de defilement, pas un chronometre.
 * Tout le reste est editorial : grands titres en serif, filets, listes
 * numerotees quand l ordre compte vraiment, et aucune grille de cartes.
 *
 * Le telephone rend un VRAI profil avec les memes composants que ceux servis
 * apres un scan : la vitrine ne peut pas mentir sur le produit.
 *
 * Tout le mouvement est en CSS (animation-timeline) : zero JavaScript
 * d animation sur la page la plus visitee. Sans prise en charge (Safari),
 * chaque scene reste a son etat de depart, lisible.
 */

const CLD = "https://res.cloudinary.com/sz6vjbkr/image/upload";

/** Le profil du heros : celui du compte de demonstration, pour que la vitrine et la demo se reconnaissent. */
function heroProfile(): PublicProfile {
  const base = demoProfile("obsidian");
  return {
    ...base,
    identity: {
      ...base.identity,
      displayName: "Landry Mbarga",
      firstName: "Landry",
      lastName: "Mbarga",
      title: "Photographe · Directeur artistique",
      company: "Studio Mbarga",
      tagline: "Je photographie les gens comme ils sont, pas comme ils posent",
      bio: "Portraits, mariages et campagnes de marque, à Douala et partout où l’avion va.",
      avatarUrl: `${CLD}/c_fill,w_900,h_1125,g_face/samples/man-portrait.jpg`,
      coverUrl: null,
      logoUrl: null,
    },
    contact: { ...base.contact, email: "landry@studiombarga.cm", website: "https://studiombarga.cm" },
    presentation: { ...base.presentation, availability: "Disponible pour des commandes en janvier" },
  };
}

/** Le parcours d un evenement, dans l ordre ou il se vit : la numerotation dit cet ordre. */
const EVENT_STEPS = [
  { title: "Créer", body: "Lieux, programme, menu, dress code. Une page par événement, un univers par mariage." },
  { title: "Inviter", body: "Un lien par famille, partagé sur WhatsApp. Chaque invité voit son nom et ses places." },
  { title: "Répondre", body: "Présence, repas, allergies, un mot : trois étapes au pouce, sans compte à créer." },
  { title: "Accueillir", body: "QR d’accès, postes d’accueil, entrées en temps réel. Liste papier en secours." },
];

/** Les trois temps du geste, tels qu ils se produisent. */
const BEATS = [
  { time: "0 s", title: "Approcher", body: "La carte touche le téléphone. Aucune application, aucun compte pour le visiteur." },
  { time: "1 s", title: "Découvrir", body: "La carte s’ouvre dans le navigateur : recto, verso, coordonnées, liens." },
  { time: "3 s", title: "Garder", body: "Un bouton, et la fiche entre dans le carnet d’adresses. La rencontre ne se perd plus." },
];

const display = "font-[family-name:var(--app-font-display)] [font-variation-settings:'SOFT'_60,'WONK'_0] tracking-[-0.025em]";
const displayItalic = "italic [font-variation-settings:'SOFT'_100,'WONK'_1]";

export default function HomePage() {
  const profile = heroProfile();

  return (
    <div className="min-h-dvh overflow-x-clip bg-[var(--brand-ink)] text-[var(--brand-paper)]">
      <ScrollScenes />
      <header className="app-shell flex items-center justify-between py-6">
        <Wordmark />
        <nav aria-label="Principale" className="flex items-center gap-1 text-[0.85rem]">
          <a href="#invitation" className="hidden px-3 py-2 text-white/60 transition-colors hover:text-white sm:block">
            Invitations
          </a>
          <a href="#cartes" className="hidden px-3 py-2 text-white/60 transition-colors hover:text-white sm:block">
            Cartes
          </a>
          <Link href="/login" className="ml-2 rounded-full border border-white/15 px-5 py-2.5 font-medium transition-colors hover:border-white/40">
            Espace client
          </Link>
        </nav>
      </header>

      {/* ------------------------------------------------------------- Heros -- */}
      <section className="relative pb-16 pt-8 sm:pt-14">
        <div
          aria-hidden
          className="mk-layer-slow pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 45% at 22% 6%, rgba(217,142,90,0.22) 0%, transparent 66%), radial-gradient(45% 40% at 84% 55%, rgba(125,211,252,0.10) 0%, transparent 70%)",
          }}
        />
        <div className="grain opacity-[0.07]" aria-hidden />

        <div className="app-shell relative grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="max-w-2xl">
            <p className="eyebrow text-[var(--brand-copper)]">Cartes NFC · Invitations · Événements</p>
            <h1 className={cn(display, "mt-6 text-[clamp(2.6rem,1.6rem+5vw,5.4rem)] leading-[0.98]")}>
              Des invitations qu’on <span className={cn(displayItalic, "text-[var(--brand-copper)]")}>ouvre</span>.
              <br />
              Des cartes qu’on <span className={cn(displayItalic, "text-[var(--brand-copper)]")}>garde</span>.
            </h1>
            <p className="mt-7 max-w-md text-[1.05rem] leading-relaxed text-white/60">
              Donnez à votre identité, à vos invitations et à vos événements le soin d’un objet imprimé — et la vie d’une page.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="group tap-target rounded-full bg-[var(--brand-paper)] px-6 font-semibold text-[var(--brand-ink)] transition-colors hover:bg-white"
              >
                Créer mon compte
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a href="#invitation" className="tap-target px-2 text-[0.92rem] text-white/60 underline-offset-[6px] transition-colors hover:text-white hover:underline">
                Voir une invitation s’ouvrir
              </a>
            </div>
          </div>

          {/* La scene : le pli derriere, le telephone devant, a deux vitesses. */}
          <div className="relative mx-auto h-[600px] w-full max-w-[400px] lg:mx-0">
            <div className="mk-layer-mid absolute left-0 top-6 w-[64%] -rotate-[9deg]">
              <EnvelopeScene monogram="C & H" hosts="Clarisse & Hervé" recipient="Pour la famille Ngono" date="15 novembre 2026" className="w-full" />
            </div>
            <div className="mk-layer-fast absolute bottom-0 right-0">
              <PhoneFrame width={262} height={540}>
                <ThemeRenderer profile={profile} preview />
              </PhoneFrame>
              <RippleArcs className="absolute -left-10 top-24 size-16" />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Le pli qui s ouvre -- */}
      <section id="invitation" className="mk-scene relative h-[240svh] border-t border-[var(--brand-line)]">
        <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(70% 55% at 50% 35%, rgba(234,224,204,0.10) 0%, transparent 70%)" }}
          />
          <p className="eyebrow relative text-white/40">Une invitation</p>
          <h2 className={cn(display, "relative mt-4 max-w-2xl text-center text-[clamp(1.8rem,1.2rem+2.6vw,3.2rem)] leading-[1.04]")}>
            Elle arrive sous pli, au nom de l’invité.
            <br />
            <span className={cn(displayItalic, "text-white/55")}>Faites défiler : elle s’ouvre.</span>
          </h2>
          {/* Assez d air au-dessus : le rabat ouvert monte de 64 % de sa hauteur. */}
          <div className="relative mt-[min(34vw,150px)]">
            <EnvelopeScene monogram="C & H" hosts="Clarisse & Hervé" recipient="Pour la famille Ngono" date="Samedi 15 novembre 2026" />
          </div>
          <p className="mk-caption relative mt-12 max-w-md text-center text-[0.95rem] leading-relaxed text-white/55">
            Cachet de cire, rabat, carton qui sort du pli. Puis une composition éditoriale : le mot des mariés, la photographie, les lieux, la réponse en trois étapes.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------ Événements -- */}
      <section className="border-t border-[var(--brand-line)] py-24">
        <div className="app-shell grid gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="eyebrow text-white/40">Événements</p>
            <h2 className={cn(display, "mt-4 text-[clamp(2rem,1.3rem+2.6vw,3.4rem)] leading-[1.02]")}>
              Le faire-part devient un lien. La liste des invités, un tableau de bord.
            </h2>
            <p className="mt-6 max-w-md text-[1rem] leading-relaxed text-white/55">
              Mariages, anniversaires, réceptions, hommages : une invitation par famille, une réponse en trois étapes, un accueil par QR le jour J. Même plateforme, même compte.
            </p>
            <Link href="/dashboard/events/new" className="tap-target mt-6 w-fit text-[0.95rem] font-medium text-[var(--brand-copper)] underline-offset-[6px] hover:underline">
              Créer un événement
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <ol className="divide-y divide-[var(--brand-line)] border-y border-[var(--brand-line)]">
            {EVENT_STEPS.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[3.5rem_1fr] gap-4 py-6">
                <span className={cn(display, "text-[1.6rem] leading-none text-[var(--brand-copper)]")}>0{i + 1}</span>
                <div>
                  <h3 className="text-[1.15rem] font-semibold tracking-[-0.01em]">{step.title}</h3>
                  <p className="mt-1.5 text-[0.92rem] leading-relaxed text-white/50">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Les univers : un index typographique, pas une grille de pastilles. */}
        <div className="app-shell mt-20">
          <p className="eyebrow text-white/40">Vingt univers, quatre collections</p>
          <ul className="mt-6 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {(Object.keys(COLLECTION_LABELS) as InvitationCollection[]).map((collection) => (
              <li key={collection} className="border-t border-[var(--brand-line)] pt-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/45">{COLLECTION_LABELS[collection]}</p>
                <p className={cn(display, "mt-3 text-[clamp(1.25rem,1rem+1.2vw,1.8rem)] leading-[1.35] text-white/85")}>
                  {themesOf(collection).map((t, i, all) => (
                    <span key={t.key}>
                      {t.name}
                      {i < all.length - 1 && <span className="text-white/25"> · </span>}
                    </span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------------------------------------- Cartes de visite -- */}
      <section id="cartes" className="relative overflow-hidden border-t border-[var(--brand-line)] bg-[var(--console-paper)] py-24 text-[var(--brand-ink)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(55% 50% at 90% 10%, rgba(217,142,90,0.18) 0%, transparent 70%)" }}
        />
        <div className="app-shell relative grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow text-[var(--brand-copper-deep)]">Cartes de visite</p>
            <h2 className={cn(display, "mt-4 text-[clamp(2rem,1.3rem+2.6vw,3.4rem)] leading-[1.02]")}>Une identité, pas une fiche.</h2>
            <p className="mt-6 max-w-md text-[1rem] leading-relaxed text-[var(--muted)]">
              Recto : le monogramme, le nom, l’identité graphique. Verso : la fonction, les coordonnées, le QR. La carte se retourne du doigt, et un bouton enregistre le contact.
            </p>
            <div className="mt-8 max-w-[22rem] overflow-hidden rounded-[10px] bg-[var(--brand-ink)] px-4 py-3">
              <code className="block truncate font-[family-name:var(--app-font-mono)] text-[1.05rem] tracking-tight text-[var(--brand-copper)]">tap.exemple/c/A7K2M9Q</code>
            </div>
            <p className="mt-3 max-w-md text-[0.9rem] leading-relaxed text-[var(--muted)]">
              La puce ne contient que cette adresse, définitive. Vous changez de poste, de numéro, de photo : la carte suit, la puce ne bouge pas.
            </p>
          </div>

          <div className="relative mx-auto w-fit">
            <PhoneFrame width={280} height={570}>
              <ThemeRenderer profile={{ ...profile, cardToken: "APERCU" }} preview />
            </PhoneFrame>
          </div>
        </div>

        {/* Treize designs : un index par famille, le nom en grand. */}
        <div className="app-shell relative mt-24">
          <p className="eyebrow text-[var(--brand-copper-deep)]">
            {PREMIUM_ENGINES.length} designs, {FAMILIES.length} familles
          </p>
          <ul className="mt-6 divide-y divide-[var(--brand-ink)]/10 border-y border-[var(--brand-ink)]/10">
            {FAMILIES.map((family) => (
              <li key={family.key} className="grid gap-3 py-6 sm:grid-cols-[13rem_1fr]">
                <p className="pt-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]/45">{family.label}</p>
                <ul className="flex flex-wrap gap-x-7 gap-y-3">
                  {PREMIUM_ENGINES.filter((e) => e.family === family.key).map((engine) => (
                    <li key={engine.key}>
                      <span className={cn(display, "text-[clamp(1.4rem,1rem+1.4vw,2rem)] leading-none")}>{engine.name}</span>
                      <span className="ml-2 align-middle text-[0.7rem] uppercase tracking-[0.14em] text-[var(--brand-ink)]/40">{engine.tags[0]}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------- Le geste -- */}
      <section className="border-t border-[var(--brand-line)] py-24">
        <div className="app-shell">
          <p className="eyebrow text-white/40">Le geste</p>
          <h2 className={cn(display, "mt-4 max-w-2xl text-[clamp(2rem,1.3rem+2.6vw,3.4rem)] leading-[1.02]")}>
            Trois secondes entre la poignée de main et le contact enregistré.
          </h2>
          <ol className="mt-14 grid gap-10 border-t border-[var(--brand-line)] pt-8 md:grid-cols-3">
            {BEATS.map((beat) => (
              <li key={beat.title}>
                <span className={cn(display, "text-[2.4rem] leading-none text-[var(--brand-copper)]")}>{beat.time}</span>
                <h3 className="mt-4 text-[1.15rem] font-semibold tracking-[-0.01em]">{beat.title}</h3>
                <p className="mt-2 max-w-xs text-[0.92rem] leading-relaxed text-white/50">{beat.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------------------------- Les liens restreints -- */}
      <section className="border-t border-[var(--brand-line)] py-24">
        <div className="app-shell grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="eyebrow text-white/40">Liens restreints</p>
            <h2 className={cn(display, "mt-4 text-[clamp(1.8rem,1.2rem+2vw,2.8rem)] leading-[1.05]")}>On ne donne pas la même chose à tout le monde.</h2>
            <p className="mt-6 max-w-md text-[1rem] leading-relaxed text-white/55">
              Une cérémonie, un salon, un premier rendez-vous : créez un lien qui n’expose que ce que vous cochez, avec son propre habillage. Corriger votre numéro le corrige partout, y compris dans les liens déjà distribués.
            </p>
          </div>
          <ul className="divide-y divide-[var(--brand-line)] border-y border-[var(--brand-line)]">
            {(
              [
                ["Cérémonie", "Nom, photo, téléphone", 25],
                ["Salon professionnel", "Fonction, entreprise, site, LinkedIn", 45],
                ["Carte NFC", "Le profil entier", 100],
              ] as const
            ).map(([label, what, pct]) => (
              <li key={label} className="grid grid-cols-[1fr_5rem] items-center gap-4 py-5">
                <span>
                  <span className="block text-[1rem] font-semibold">{label}</span>
                  <span className="block text-[0.85rem] text-white/45">{what}</span>
                </span>
                {/* La part de soi que l on accepte de donner, rendue visible. */}
                <span aria-hidden className="block h-px w-full overflow-hidden bg-white/12">
                  <span className="block h-full bg-[var(--brand-copper)]" style={{ width: `${pct}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------- CTA final -- */}
      <section className="border-t border-[var(--brand-line)] py-28">
        <div className="app-shell flex flex-col items-start gap-9">
          <h2 className={cn(display, "max-w-3xl text-[clamp(2.2rem,1.4rem+3.4vw,4.4rem)] leading-[0.98]")}>
            Faites de votre prochaine rencontre <span className={cn(displayItalic, "text-[var(--brand-copper)]")}>un objet</span> qu’on garde.
          </h2>
          <Link
            href="/login"
            className="group tap-target rounded-full bg-[var(--brand-paper)] px-7 font-semibold text-[var(--brand-ink)] transition-colors hover:bg-white"
          >
            Créer mon compte
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------- Pied -- */}
      <footer className="border-t border-[var(--brand-line)]">
        <div className="app-shell flex flex-col gap-8 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <LogoMark className="h-8 text-[var(--brand-paper)]" animated />
            <p className="mt-4 max-w-xs text-[0.85rem] leading-relaxed text-white/40">{siteConfig.tagline}</p>
          </div>
          <Link href="/login" className="tap-target w-fit rounded-full border border-white/20 px-6 font-medium transition-colors hover:border-white/50">
            Espace client
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
