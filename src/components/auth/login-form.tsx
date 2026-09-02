"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { login, type LoginState } from "@/app/(auth)/actions";

const INITIAL: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction] = useActionState(login, INITIAL);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <Field label="E-mail" name="email" type="email" autoComplete="email" placeholder="vous@entreprise.com" required />
      <Field
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••••"
        required
      />

      {/* L echec doit se voir dans le formulaire, pas seulement dans l URL. */}
      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[0.82rem] text-red-700"
        >
          <AlertCircle className="mt-px size-4 shrink-0" />
          {state.error}
        </p>
      )}

      <Submit />

      <Link
        href="/forgot-password"
        className="block pt-1 text-center text-[0.8rem] text-neutral-500 underline-offset-4 hover:underline"
      >
        Mot de passe oublie
      </Link>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group tap-target mt-1 w-full justify-center rounded-xl bg-[var(--brand-ink)] px-6 text-[0.95rem] font-semibold text-[var(--brand-paper)] transition-colors hover:bg-[#161b26] disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Connexion...
        </>
      ) : (
        <>
          Se connecter
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.78rem] font-medium text-neutral-700">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-[0.95rem] text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-[var(--brand-copper)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-copper)]/15"
      />
    </label>
  );
}
