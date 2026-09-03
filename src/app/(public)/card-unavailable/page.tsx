import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carte indisponible",
  robots: { index: false, follow: false },
};

const MESSAGES: Record<string, string> = {
  suspended: "Cette carte a ete desactivee par son proprietaire.",
  unassigned: "Cette carte n est pas encore associee a un profil.",
  unpublished: "Ce profil n est pas encore publie.",
  // Liens de partage restreints : meme page neutre, meme discretion. On ne
  // dit jamais de QUI il s agissait.
  disabled: "Ce lien de partage a ete desactive par son proprietaire.",
  expired: "Ce lien de partage a expire.",
};

/**
 * §11 - "Une carte suspendue affiche une page neutre et ne revele pas les
 * anciennes informations." Aucune donnee de profil ne transite par cette page.
 */
export default async function CardUnavailablePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <main className="profile-shell flex min-h-dvh flex-col items-center justify-center gap-3 text-center">
      <div className="mb-2 h-12 w-12 rounded-full border border-[var(--border)]" aria-hidden />
      <h1 className="text-xl font-medium">Carte indisponible</h1>
      <p className="max-w-xs text-sm text-[var(--muted)]">
        {MESSAGES[reason ?? ""] ?? "Cette carte n est pas active pour le moment."}
      </p>
    </main>
  );
}
