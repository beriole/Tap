export default function Forbidden() {
  return (
    <main className="profile-shell flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm tracking-widest text-[var(--muted)]">403</p>
      <h1 className="text-2xl font-medium">Acces refuse</h1>
      <p className="text-[var(--muted)]">Vous n avez pas les droits sur cette ressource.</p>
    </main>
  );
}
