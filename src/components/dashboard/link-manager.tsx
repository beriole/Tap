"use client";

import { useState } from "react";
import type { ProfileLink } from "@prisma/client";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { LINK_CATEGORIES, LINK_TYPES, linkTypesByCategory } from "@/config/link-types";
import { BrandIcon } from "@/components/profile/brand-icon";

/**
 * §5.3 / §6.2 - Gestion dynamique des liens : ajout par type, edition,
 * visibilite et reordonnancement.
 *
 * Le reordonnancement utilise ici des fleches haut/bas : accessible au clavier
 * et suffisant en P0. Le glisser-deposer (§6.2) se branchera sur la meme route
 * /api/profile/links/reorder sans changer le contrat serveur.
 */
export function LinkManager({ links: initial }: { links: ProfileLink[] }) {
  const [links, setLinks] = useState(initial);
  const [adding, setAdding] = useState(false);

  async function persistOrder(next: ProfileLink[]) {
    setLinks(next);
    await fetch("/api/profile/links/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((l) => l.id) }),
    });
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    [next[index], next[target]] = [next[target], next[index]];
    void persistOrder(next);
  }

  async function toggleVisible(link: ProfileLink) {
    const isVisible = !link.isVisible;
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, isVisible } : l)));
    await fetch("/api/profile/links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: link.id, isVisible }),
    });
  }

  async function remove(link: ProfileLink) {
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
    await fetch(`/api/profile/links?id=${link.id}`, { method: "DELETE" });
  }

  async function create(formData: FormData) {
    const type = String(formData.get("type"));
    const description = String(formData.get("description") || "").trim();
    const payload = {
      type,
      label: String(formData.get("label") || LINK_TYPES[type as keyof typeof LINK_TYPES].label),
      // Vide -> null : le theme retombe alors sur le sous-titre standard du
      // type de lien plutot que d afficher une ligne blanche.
      description: description || null,
      value: String(formData.get("value")),
      isVisible: true,
    };
    const response = await fetch("/api/profile/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const { link } = await response.json();
      setLinks((prev) => [...prev, link]);
      setAdding(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <ul className="space-y-2">
        {links.map((link, index) => (
          <li
            key={link.id}
            className="flex items-center gap-3 rounded-[var(--radius-button)] border border-[var(--border)] p-3"
          >
            <BrandIcon name={link.icon ?? link.type} className="size-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{link.label}</p>
              {link.description && (
                <p className="truncate text-xs text-[var(--accent)]">{link.description}</p>
              )}
              <p className="truncate text-xs text-[var(--muted)]">{link.value}</p>
            </div>
            <IconButton label="Monter" onClick={() => move(index, -1)}>
              <ArrowUp className="size-4" />
            </IconButton>
            <IconButton label="Descendre" onClick={() => move(index, 1)}>
              <ArrowDown className="size-4" />
            </IconButton>
            <IconButton
              label={link.isVisible ? "Masquer" : "Afficher"}
              onClick={() => toggleVisible(link)}
            >
              {link.isVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </IconButton>
            <IconButton label="Supprimer" onClick={() => remove(link)}>
              <Trash2 className="size-4" />
            </IconButton>
          </li>
        ))}
      </ul>

      {adding ? (
        <form
          action={create}
          className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border)] p-4"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--muted)]">Type</span>
            <select
              name="type"
              className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
            >
              {LINK_CATEGORIES.map((category) => (
                <optgroup key={category.key} label={category.label}>
                  {linkTypesByCategory(category.key).map((def) => (
                    <option key={def.type} value={def.type}>
                      {def.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--muted)]">Titre</span>
            <input
              name="label"
              className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--muted)]">
              Sous-titre <span className="text-[var(--muted)]">(facultatif)</span>
            </span>
            <input
              name="description"
              maxLength={80}
              placeholder="Reponse sous 2 h"
              className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
            />
            <span className="mt-1 block text-[0.7rem] text-[var(--muted)]">
              Affiche sous le titre par les themes Signal et Hub.
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--muted)]">Valeur ou URL</span>
            <input
              name="value"
              required
              placeholder="https://..."
              className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="tap-target rounded-[var(--radius-button)] bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)]"
            >
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="tap-target rounded-[var(--radius-button)] border border-[var(--border)] px-5 text-sm"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="tap-target w-full justify-center rounded-[var(--radius-button)] border border-dashed border-[var(--border)] text-sm text-[var(--muted)]"
        >
          <Plus className="size-4" /> Ajouter un lien
        </button>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
    >
      {children}
    </button>
  );
}
