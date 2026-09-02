"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Pause, Play, Plus } from "lucide-react";

type ClientRow = { id: string; email: string; status: string };

/**
 * §16 - Clients : creer, suspendre, reactiver, reinitialiser l acces.
 *
 * Les liens d invitation et de reinitialisation sont affiches a l ecran :
 * l envoi d e-mail n est pas configure, et un lien qu on voit vaut mieux qu un
 * message qu on croit parti.
 */
export function CreateClientForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string; url?: string } | null>(null);
  const [open, setOpen] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    startTransition(async () => {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") ?? ""),
          name: String(data.get("name") ?? ""),
          displayName: String(data.get("displayName") ?? "") || undefined,
        }),
      });
      const body = await response.json().catch(() => null);

      if (response.ok) {
        form.reset();
        setResult({ ok: true, text: "Client cree. Transmettez ce lien d activation :", url: body?.inviteUrl });
        router.refresh();
        return;
      }
      setResult({ ok: false, text: body?.error ?? "Creation impossible." });
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap-target w-fit rounded-[var(--radius-button)] bg-[var(--brand-copper)] px-5 text-sm font-semibold text-[#231206] transition-transform hover:-translate-y-0.5"
      >
        <Plus className="size-4" /> Nouveau client
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[var(--console-hairline)] bg-[var(--console-card)] p-5 sm:p-6"
    >
      <h2 className="text-sm font-medium">Nouveau client</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Input name="email" type="email" required placeholder="client@exemple.com" />
        <Input name="name" required placeholder="Nom du contact" />
        <Input name="displayName" placeholder="Nom affiche sur le profil" />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="tap-target rounded-[var(--radius-button)] bg-[var(--brand-copper)] px-5 text-sm font-semibold text-[#231206] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {pending ? "Creation..." : "Creer"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="tap-target rounded-[var(--radius-button)] border border-[var(--console-hairline)] px-5 text-sm"
        >
          Annuler
        </button>
      </div>

      {result && (
        <div className="mt-3 text-sm">
          <p className={result.ok ? "text-[var(--accent)]" : "text-red-600"}>{result.text}</p>
          {result.url && (
            <code className="mt-1 block break-all rounded bg-[var(--console-paper)] p-2 text-xs">
              {result.url}
            </code>
          )}
        </div>
      )}
    </form>
  );
}

export function ClientRowActions({ client }: { client: ClientRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  function run(action: "SUSPEND" | "REACTIVATE" | "RESET_ACCESS") {
    startTransition(async () => {
      const response = await fetch("/api/admin/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: client.id, action }),
      });
      const body = await response.json().catch(() => null);
      if (action === "RESET_ACCESS" && response.ok) setResetUrl(body?.resetUrl ?? null);
      router.refresh();
    });
  }

  const suspended = client.status === "SUSPENDED";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        <Action
          label={suspended ? "Reactiver" : "Suspendre"}
          disabled={pending}
          onClick={() => run(suspended ? "REACTIVATE" : "SUSPEND")}
        >
          {suspended ? <Play className="size-4" /> : <Pause className="size-4" />}
        </Action>
        <Action label="Reinitialiser l acces" disabled={pending} onClick={() => run("RESET_ACCESS")}>
          <KeyRound className="size-4" />
        </Action>
      </div>
      {resetUrl && <code className="max-w-[16rem] truncate text-[0.65rem]">{resetUrl}</code>}
    </div>
  );
}

function Action({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-lg border border-[var(--console-hairline)] text-[var(--muted)] transition-colors hover:text-[var(--foreground)] disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-[var(--radius-button)] border border-[var(--console-hairline)] bg-[var(--console-paper)] px-3 py-2.5 text-sm"
    />
  );
}
