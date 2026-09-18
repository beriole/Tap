"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  // Une erreur qui a atteint cette page a echappe a tout le reste : on la remonte (§20).
  useEffect(() => {
    fetch("/api/monitoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: error.message, name: error.name, stack: error.stack?.slice(0, 4000), url: location.pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [error]);

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
