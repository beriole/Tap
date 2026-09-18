"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Plus, UserMinus } from "lucide-react";
import { Pill, SectionTitle, Surface } from "@/components/app/ui";
import type { EventPermission } from "@/lib/events/permissions";
import { Button, Field, FormMessage, sendJson, TextInput } from "./form-kit";

/**
 * Equipe (D5) : co-organisateurs et leurs permissions, par le proprietaire.
 *
 * Les permissions sont des cases nommees par ce qu elles ouvrent, pas par un
 * role abstrait : "Invites", "Partage", "Accueil"... Un oncle qui tient
 * l entree n a besoin que d Accueil ; la soeur qui gere la liste, d Invites
 * et Partage.
 */

export const PERMISSION_LABELS: { key: EventPermission; label: string; hint: string }[] = [
  { key: "guests", label: "Invites", hint: "Ajouter, modifier, importer" },
  { key: "messages", label: "Partage", hint: "Envoyer les liens, revoquer" },
  { key: "checkin", label: "Accueil", hint: "Postes et entrees le jour J" },
  { key: "design", label: "Contenu et design", hint: "Textes, lieux, theme, publication" },
  { key: "exports", label: "Exports", hint: "Fichiers pour Excel et le traiteur" },
  { key: "sensitive", label: "Donnees sensibles", hint: "Allergies, notes internes" },
];

export type MemberRow = { id: string; name: string | null; email: string; role: "OWNER" | "COORGANIZER"; pending: boolean; permissions: string[] };

export function TeamManager({ eventId, members, canManage }: { eventId: string; members: MemberRow[]; canManage: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [perms, setPerms] = useState<Set<string>>(new Set(["guests", "checkin"]));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ email: string; url: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  async function add() {
    setBusy(true);
    setError(null);
    const r = await sendJson<{ inviteUrl: string | null }>(`/api/organizer/events/${eventId}/team`, "POST", { email, name, permissions: [...perms] });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setInvite({ email, url: r.data.inviteUrl ? `${window.location.origin}${r.data.inviteUrl}` : null });
    setEmail("");
    setName("");
    router.refresh();
  }

  async function toggle(member: MemberRow, key: string) {
    const next = member.permissions.includes(key) ? member.permissions.filter((p) => p !== key) : [...member.permissions, key];
    const r = await sendJson(`/api/organizer/events/${eventId}/team`, "PATCH", { memberId: member.id, permissions: next });
    if (!r.ok) return setError(r.error);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {invite && (
        <Surface className="border-[var(--brand-copper)]/50">
          <SectionTitle>{invite.url ? "Compte cree : transmettez ce lien" : "Personne ajoutee"}</SectionTitle>
          {invite.url ? (
            <>
              <p className="text-[0.88rem] text-[var(--muted)]">
                {invite.email} n avait pas de compte. Ce lien lui permet de choisir son mot de passe (valable 14 jours). Aucun e-mail n est envoye automatiquement.
              </p>
              <p className="mt-3 break-all rounded-xl bg-[var(--console-paper)] p-3 font-[family-name:var(--font-mono)] text-[0.8rem]">{invite.url}</p>
              <Button
                variant="secondary"
                className="mt-3"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(invite.url!);
                    setCopied(true);
                  } catch {
                    setError("Copie impossible : selectionnez le lien.");
                  }
                }}
              >
                <Copy className="size-4" aria-hidden /> {copied ? "Copie" : "Copier le lien"}
              </Button>
            </>
          ) : (
            <p className="text-[0.88rem] text-[var(--muted)]">{invite.email} avait deja un compte : l evenement apparait maintenant dans sa liste.</p>
          )}
          <Button variant="ghost" className="mt-2" onClick={() => setInvite(null)}>
            Fermer
          </Button>
        </Surface>
      )}

      {canManage && (
        <Surface>
          <SectionTitle>Ajouter un co-organisateur</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Prenom et nom">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Carine Ngono" />
            </Field>
            <Field label="E-mail">
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="carine@exemple.cm" />
            </Field>
          </div>
          <fieldset className="mt-4">
            <legend className="mb-2 text-[0.78rem] text-[var(--muted)]">Ce qu elle peut faire</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PERMISSION_LABELS.map((p) => (
                <label key={p.key} className="flex items-start gap-2.5 rounded-xl border border-[var(--console-hairline)] p-3 text-[0.86rem] has-[:checked]:border-[var(--brand-ink)]">
                  <input
                    type="checkbox"
                    checked={perms.has(p.key)}
                    onChange={(e) => {
                      const next = new Set(perms);
                      if (e.target.checked) next.add(p.key);
                      else next.delete(p.key);
                      setPerms(next);
                    }}
                    className="mt-0.5 size-4 accent-[var(--brand-copper-deep)]"
                  />
                  <span>
                    <span className="block font-medium">{p.label}</span>
                    <span className="block text-[0.76rem] text-[var(--muted)]">{p.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button busy={busy} disabled={!email.trim() || name.trim().length < 2} onClick={add}>
              <Plus className="size-4" aria-hidden /> Ajouter
            </Button>
            {error && <FormMessage tone="error">{error}</FormMessage>}
          </div>
        </Surface>
      )}

      <Surface>
        <SectionTitle hint={`${members.length} personne${members.length > 1 ? "s" : ""}`}>Equipe</SectionTitle>
        <ul className="divide-y divide-[var(--console-hairline)]">
          {members.map((m) => (
            <li key={m.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    {m.name ?? m.email}
                    {m.role === "OWNER" ? <Pill tone="idle">Proprietaire</Pill> : m.pending ? <Pill tone="warn">Compte non active</Pill> : <Pill tone="live">Co-organisateur</Pill>}
                  </p>
                  <p className="text-[0.78rem] text-[var(--muted)]">{m.email}</p>
                </div>
                {canManage && m.role === "COORGANIZER" && (
                  <Button
                    variant="danger"
                    onClick={async () => {
                      if (!window.confirm(`Retirer ${m.name ?? m.email} de l equipe ?`)) return;
                      const r = await sendJson(`/api/organizer/events/${eventId}/team?member=${m.id}`, "DELETE");
                      if (!r.ok) return setError(r.error);
                      router.refresh();
                    }}
                  >
                    <UserMinus className="size-4" aria-hidden /> Retirer
                  </Button>
                )}
              </div>
              {m.role === "COORGANIZER" && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PERMISSION_LABELS.map((p) => {
                    const on = m.permissions.includes(p.key);
                    return canManage ? (
                      <button
                        key={p.key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(m, p.key)}
                        className={`rounded-full border px-3 py-1 text-[0.76rem] transition-colors ${on ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-paper)]" : "border-[var(--console-hairline)] text-[var(--muted)]"}`}
                      >
                        {p.label}
                      </button>
                    ) : on ? (
                      <Pill key={p.key} tone="idle">
                        {p.label}
                      </Pill>
                    ) : null;
                  })}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
