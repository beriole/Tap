"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Champs de formulaire de l espace organisateur.
 *
 * Memes matieres que le reste de la console (papier chaud, filet, rayon 12) :
 * un organisateur passe d une carte NFC a un mariage sans changer d outil.
 * Taille de texte 16 px dans les champs sur mobile : en dessous, iOS zoome
 * la page a chaque saisie.
 */

const control =
  "w-full rounded-xl border border-[var(--console-hairline)] bg-[var(--console-paper)] px-3.5 py-2.5 text-[1rem] sm:text-[0.9rem] outline-none transition-colors focus:border-[var(--brand-copper)] focus:bg-white aria-[invalid=true]:border-[var(--state-stop)]";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="mb-1.5 block text-[0.78rem] text-[var(--muted)]">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-[0.76rem] text-[var(--state-stop)]">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-[0.74rem] text-[var(--muted)]">{hint}</span>
      )}
    </label>
  );
}

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn(control, className)} {...props} />;
  },
);

export function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-24 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(control, "pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Button({
  variant = "primary",
  busy,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; busy?: boolean }) {
  return (
    <button
      type="button"
      disabled={busy || props.disabled}
      className={cn(
        "tap-target inline-flex items-center justify-center gap-2 rounded-xl px-5 text-[0.87rem] font-semibold transition-[transform,background-color] duration-150 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100",
        variant === "primary" && "bg-[var(--brand-copper)] text-[#231206] hover:bg-[var(--brand-copper-deep)] hover:text-white",
        variant === "secondary" && "border border-[var(--console-hairline)] bg-[var(--console-card)] hover:bg-[var(--console-paper)]",
        variant === "ghost" && "px-3 font-medium text-[var(--muted)] hover:text-[var(--foreground)]",
        variant === "danger" && "border border-[var(--state-stop)]/30 px-3 font-medium text-[var(--state-stop)] hover:bg-[var(--state-stop)]/5",
        className,
      )}
      {...props}
    >
      {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function FormMessage({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn("text-[0.84rem]", tone === "error" ? "text-[var(--state-stop)]" : "text-[var(--state-live)]")}
    >
      {children}
    </p>
  );
}

/** Appel JSON vers l API organisateur ; renvoie le message d erreur lisible. */
export async function sendJson<T = unknown>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<
  | { ok: true; data: T }
  | { ok: false; error: string; issues?: { path: (string | number)[]; message: string }[] }
> {
  try {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return { ok: true, data: undefined as T };
    const data = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: data?.error ?? "L enregistrement a echoue.", issues: data?.issues };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "Connexion impossible. Verifiez le reseau et reessayez." };
  }
}
