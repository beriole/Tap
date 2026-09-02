"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

const input =
  "w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm";
const submit =
  "tap-target w-full justify-center rounded-[var(--radius-button)] bg-[var(--foreground)] font-medium text-[var(--background)] disabled:opacity-60";

/** §5.1 - Demande de lien de reinitialisation. */
export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [devUrl, setDevUrl] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");

    startTransition(async () => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json().catch(() => null);
      setMessage(body?.message ?? body?.error ?? "Demande enregistree.");
      setDevUrl(body?.devResetUrl ?? null);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <input name="email" type="email" required placeholder="vous@exemple.com" className={input} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? "Envoi..." : "Envoyer le lien"}
      </button>

      {message && <p className="text-sm text-[var(--muted)]">{message}</p>}

      {/* L envoi d e-mail n est pas configure : en developpement on affiche le
          lien plutot que de laisser croire qu un message est parti. */}
      {devUrl && (
        <p className="rounded-[var(--radius-button)] border border-dashed border-[var(--border)] p-3 text-xs">
          E-mail non configure. Lien de test :{" "}
          <Link href={devUrl} className="underline underline-offset-2">
            ouvrir
          </Link>
        </p>
      )}
    </form>
  );
}

/** §5.1 - Definition du nouveau mot de passe, aussi utilisee a l activation. */
export function ResetPasswordForm({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: String(data.get("password") ?? ""),
          confirmPassword: String(data.get("confirmPassword") ?? ""),
        }),
      });

      if (response.ok) {
        setMessage({ ok: true, text: "Mot de passe enregistre. Vous pouvez vous connecter." });
        return;
      }
      const body = await response.json().catch(() => null);
      setMessage({ ok: false, text: body?.error ?? "Enregistrement impossible." });
    });
  }

  if (!token) {
    return (
      <p className="mt-4 text-sm text-[var(--muted)]">
        Ce lien est incomplet. Demandez-en un nouveau depuis{" "}
        <Link href="/forgot-password" className="underline underline-offset-2">
          mot de passe oublie
        </Link>
        .
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <input
        name="password"
        type="password"
        required
        minLength={10}
        autoComplete="new-password"
        placeholder="Nouveau mot de passe"
        className={input}
      />
      <input
        name="confirmPassword"
        type="password"
        required
        autoComplete="new-password"
        placeholder="Confirmation"
        className={input}
      />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>

      {message && (
        <p className={`text-sm ${message.ok ? "text-[var(--accent)]" : "text-red-600"}`}>
          {message.text}{" "}
          {message.ok && (
            <Link href="/login" className="underline underline-offset-2">
              Se connecter
            </Link>
          )}
        </p>
      )}
    </form>
  );
}
