import Link from "next/link";

export default function NotFound() {
  return (
    <main className="profile-shell flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm tracking-widest text-[var(--muted)]">404</p>
      <h1 className="text-2xl font-medium">Page introuvable</h1>
      <p className="text-[var(--muted)]">Le lien demande n existe pas ou a ete deplace.</p>
      <Link href="/" className="text-sm underline underline-offset-4">
        Retour a l accueil
      </Link>
    </main>
  );
}
