"use client";

import { useState, useTransition } from "react";

/** §5.1 / §12 - Changement de mot de passe, valide serveur avant tout. */
export function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    startTransition(async () => {
      const response = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: String(data.get("currentPassword") ?? ""),
          password: String(data.get("password") ?? ""),
          confirmPassword: String(data.get("confirmPassword") ?? ""),
        }),
      });

      if (response.ok) {
        form.reset();
        setMessage({
          ok: true,
          text: "Mot de passe mis a jour. Vos autres appareils ont ete deconnectes.",
        });
        return;
      }

      const body = await response.json().catch(() => null);
      setMessage({ ok: false, text: body?.error ?? "Mise a jour impossible." });
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <Field name="currentPassword" placeholder="Mot de passe actuel" autoComplete="current-password" />
      <Field name="password" placeholder="Nouveau mot de passe" autoComplete="new-password" />
      <Field name="confirmPassword" placeholder="Confirmer le nouveau mot de passe" autoComplete="new-password" />

      <p className="text-xs text-[var(--muted)]">
        10 caracteres minimum, avec une majuscule, une minuscule et un chiffre.
      </p>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="tap-target rounded-[var(--radius-button)] bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] disabled:opacity-60"
        >
          {pending ? "Mise a jour..." : "Mettre a jour"}
        </button>
        {message && (
          <p className={`text-sm ${message.ok ? "text-[var(--accent)]" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="password"
      required
      className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
    />
  );
}
