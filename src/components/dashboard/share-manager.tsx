"use client";

import { useMemo, useState } from "react";
import type { ProfileLink, ShareLink } from "@prisma/client";
import {
  Check,
  Copy,
  Eye,
  Link2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { SectionTitle, StatusBadge, Surface } from "@/components/app/ui";
import { cn } from "@/lib/utils";

/**
 * Liens de partage restreints.
 *
 * L idee du produit : la carte donne tout, un lien de partage ne donne que ce
 * qu on a choisi. Une ceremonie, un salon, un premier rendez-vous commercial
 * n appellent pas la meme quantite de soi.
 *
 * L ecran est donc construit autour d une seule question - "que voit la
 * personne a qui je donne ce lien ?" - et repond en montrant, a chaque
 * changement de case, le compte exact de ce qui sort.
 */

type ShareField = { key: string; label: string; group: string };

export type ShareRow = ShareLink & { fields: string[] };

type Draft = {
  id: string | null;
  label: string;
  fields: Set<string>;
  linkIds: Set<string>;
  themeKey: string;
  accentColor: string;
  isActive: boolean;
};

const emptyDraft = (): Draft => ({
  id: null,
  label: "",
  // Un lien vierge n expose rien d autre que le nom : c est a son auteur
  // d ouvrir, pas au produit de decider a sa place.
  fields: new Set<string>(),
  linkIds: new Set<string>(),
  themeKey: "",
  accentColor: "",
  isActive: true,
});

export function ShareManager({
  shares: initial,
  links,
  fields,
  themes,
  baseUrl,
}: {
  shares: ShareRow[];
  links: Pick<ProfileLink, "id" | "label" | "type">[];
  fields: ShareField[];
  themes: { key: string; name: string }[];
  baseUrl: string;
}) {
  const [shares, setShares] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const groups = useMemo(() => {
    const out = new Map<string, ShareField[]>();
    for (const f of fields) {
      const list = out.get(f.group) ?? [];
      list.push(f);
      out.set(f.group, list);
    }
    return [...out.entries()];
  }, [fields]);

  const exposed = draft ? draft.fields.size + draft.linkIds.size : 0;

  function toggle(set: Set<string>, key: string) {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError(null);

    const payload = {
      label: draft.label.trim(),
      fields: [...draft.fields],
      linkIds: [...draft.linkIds],
      themeKey: draft.themeKey || null,
      accentColor: draft.accentColor || null,
      isActive: draft.isActive,
    };

    const response = await fetch("/api/profile/share-links", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft.id ? { id: draft.id, ...payload } : payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Enregistrement impossible.");
      setBusy(false);
      return;
    }

    const { share } = (await response.json()) as { share: ShareLink };
    const row: ShareRow = { ...share, fields: [...draft.fields] };
    setShares((prev) =>
      draft.id ? prev.map((s) => (s.id === row.id ? row : s)) : [row, ...prev],
    );
    setDraft(null);
    setBusy(false);
  }

  async function remove(share: ShareRow) {
    setShares((prev) => prev.filter((s) => s.id !== share.id));
    await fetch(`/api/profile/share-links?id=${share.id}`, { method: "DELETE" });
  }

  async function copy(slug: string) {
    await navigator.clipboard.writeText(`${baseUrl}/s/${slug}`).catch(() => {});
    setCopied(slug);
    setTimeout(() => setCopied((c) => (c === slug ? null : c)), 2000);
  }

  return (
    <div className="space-y-6">
      {!draft && (
        <button
          type="button"
          onClick={() => setDraft(emptyDraft())}
          className="tap-target w-fit rounded-xl bg-[var(--brand-copper)] px-5 text-[0.87rem] font-semibold text-[#231206] transition-transform hover:-translate-y-0.5"
        >
          <Plus className="size-4" />
          Nouveau lien restreint
        </button>
      )}

      {draft && (
        <Surface>
          <SectionTitle
            hint={
              exposed === 0
                ? "Rien de coche : seul votre nom apparaitra"
                : `${exposed} element${exposed > 1 ? "s" : ""} expose${exposed > 1 ? "s" : ""}`
            }
          >
            {draft.id ? "Modifier le lien" : "Nouveau lien restreint"}
          </SectionTitle>

          <label className="block">
            <span className="mb-1.5 block text-[0.78rem] text-[var(--muted)]">
              A quelle occasion sert ce lien ?
            </span>
            <input
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder="Ceremonie, salon de Douala, prospection…"
              className="w-full rounded-xl border border-[var(--console-hairline)] bg-[var(--console-paper)] px-3.5 py-2.5 text-[0.9rem]"
            />
          </label>

          <div className="mt-6 space-y-5">
            {groups.map(([group, list]) => (
              <fieldset key={group}>
                <legend className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {group}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {list.map((f) => (
                    <Toggle
                      key={f.key}
                      active={draft.fields.has(f.key)}
                      onClick={() => setDraft({ ...draft, fields: toggle(draft.fields, f.key) })}
                    >
                      {f.label}
                    </Toggle>
                  ))}
                </div>
              </fieldset>
            ))}

            <fieldset>
              <legend className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Liens
              </legend>
              {links.length === 0 ? (
                <p className="text-[0.82rem] text-[var(--muted)]">
                  Vous n avez pas encore de lien a partager.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {links.map((l) => (
                    <Toggle
                      key={l.id}
                      active={draft.linkIds.has(l.id)}
                      onClick={() => setDraft({ ...draft, linkIds: toggle(draft.linkIds, l.id) })}
                    >
                      {l.label}
                    </Toggle>
                  ))}
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Habillage
              </legend>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={draft.themeKey}
                  onChange={(e) => setDraft({ ...draft, themeKey: e.target.value })}
                  className="rounded-xl border border-[var(--console-hairline)] bg-[var(--console-paper)] px-3 py-2.5 text-[0.85rem]"
                >
                  <option value="">Meme theme que mon profil</option>
                  {themes.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-[0.82rem] text-[var(--muted)]">
                  Couleur
                  <input
                    type="color"
                    value={draft.accentColor || "#b08d57"}
                    onChange={(e) => setDraft({ ...draft, accentColor: e.target.value })}
                    className="size-9 cursor-pointer rounded-lg border border-[var(--console-hairline)] bg-transparent p-0.5"
                  />
                </label>
              </div>
            </fieldset>
          </div>

          {error && <p className="mt-4 text-[0.82rem] text-[var(--state-stop)]">{error}</p>}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy || draft.label.trim().length < 2}
              className="tap-target rounded-xl bg-[var(--brand-copper)] px-5 text-[0.87rem] font-semibold text-[#231206] disabled:opacity-50"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {draft.id ? "Enregistrer" : "Creer le lien"}
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="tap-target rounded-xl border border-[var(--console-hairline)] px-5 text-[0.87rem]"
            >
              Annuler
            </button>
          </div>
        </Surface>
      )}

      {shares.length === 0 && !draft ? (
        <div className="rounded-2xl border border-dashed border-[var(--console-hairline)] bg-[var(--console-paper)] p-10 text-center">
          <h3 className="font-[family-name:var(--font-display)] text-[1.15rem] font-semibold">
            Aucun lien restreint
          </h3>
          <p className="mx-auto mt-2 max-w-md text-[0.87rem] leading-relaxed text-[var(--muted)]">
            Votre carte donne tout. Un lien restreint ne donne que ce que vous cochez — utile
            quand la situation ne demande pas votre profil entier.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shares.map((share) => (
            <li key={share.id}>
              <Surface className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-[family-name:var(--font-display)] text-[1.05rem] font-semibold">
                      {share.label}
                    </h3>
                    <p className="mt-1 font-[family-name:var(--font-mono)] text-[0.74rem] text-[var(--muted)]">
                      /s/{share.slug}
                    </p>
                  </div>
                  <StatusBadge
                    status={share.isActive ? "ACTIVE" : "SUSPENDED"}
                    kind="account"
                  />
                </div>

                <p className="mt-3 text-[0.8rem] text-[var(--muted)]">
                  {share.fields.length + share.linkIds.length} element
                  {share.fields.length + share.linkIds.length > 1 ? "s" : ""} expose
                  {share.fields.length + share.linkIds.length > 1 ? "s" : ""} · {share.views}{" "}
                  ouverture{share.views > 1 ? "s" : ""}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copy(share.slug)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--console-hairline)] px-3 py-2 text-[0.78rem] transition-colors hover:bg-[var(--console-paper)]"
                  >
                    {copied === share.slug ? (
                      <>
                        <Check className="size-3.5 text-[var(--state-live)]" />
                        Copie
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        Copier le lien
                      </>
                    )}
                  </button>
                  <a
                    href={`${baseUrl}/s/${share.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--console-hairline)] px-3 py-2 text-[0.78rem] transition-colors hover:bg-[var(--console-paper)]"
                  >
                    <Eye className="size-3.5" />
                    Voir
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        id: share.id,
                        label: share.label,
                        fields: new Set(share.fields),
                        linkIds: new Set(share.linkIds),
                        themeKey: "",
                        accentColor: share.accentColor ?? "",
                        isActive: share.isActive,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--console-hairline)] px-3 py-2 text-[0.78rem] transition-colors hover:bg-[var(--console-paper)]"
                  >
                    <Link2 className="size-3.5" />
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(share)}
                    aria-label={`Supprimer ${share.label}`}
                    className="inline-flex items-center rounded-lg border border-[var(--console-hairline)] px-3 py-2 text-[var(--muted)] transition-colors hover:border-[var(--state-stop)]/40 hover:text-[var(--state-stop)]"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </Surface>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Case a cocher rendue comme une pastille.
 *
 * Une liste de cases a cocher classiques serait illisible : ici on compare
 * d un coup d oeil ce qui est ouvert et ce qui ne l est pas.
 */
function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8rem] transition-all",
        active
          ? "border-[var(--brand-copper)] bg-[var(--brand-copper)]/12 font-medium text-[var(--brand-copper-deep)]"
          : "border-[var(--console-hairline)] text-[var(--muted)] hover:border-[var(--muted)]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-3.5 items-center justify-center rounded-full border",
          active
            ? "border-[var(--brand-copper)] bg-[var(--brand-copper)]"
            : "border-[var(--console-hairline)]",
        )}
      >
        {active && <Check className="size-2.5 text-white" strokeWidth={3.5} />}
      </span>
      {children}
    </button>
  );
}
