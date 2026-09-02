"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="profile-shell flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm tracking-widest text-[var(--muted)]">500</p>
      <h1 className="text-2xl font-medium">Une erreur est survenue</h1>
      <p className="text-[var(--muted)]">Reessayez dans un instant.</p>
      <button
        onClick={reset}
        className="tap-target rounded-[var(--radius-button)] bg-[var(--foreground)] px-5 text-[var(--background)]"
      >
        Reessayer
      </button>
    </main>
  );
}
