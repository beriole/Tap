"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Created = { publicToken: string; url: string };

/** §14 - Creation d un lot puis export des URL a encoder en NDEF. */
export function CardBatchForm() {
  const router = useRouter();
  const [created, setCreated] = useState<Created[]>([]);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    const response = await fetch("/api/admin/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity: Number(formData.get("quantity")),
        batch: String(formData.get("batch") || ""),
      }),
    });
    if (response.ok) {
      const data = await response.json();
      setCreated(data.cards);
      router.refresh();
    }
    setPending(false);
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] p-5">
      <h2 className="text-sm font-medium">Creer un lot</h2>
      <form action={submit} className="mt-3 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs text-[var(--muted)]">Quantite</span>
          <input
            name="quantity"
            type="number"
            min={1}
            max={500}
            defaultValue={10}
            className="w-28 rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-[var(--muted)]">Reference du lot</span>
          <input
            name="batch"
            placeholder="LOT-2026-01"
            className="rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="tap-target rounded-[var(--radius-button)] bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] disabled:opacity-60"
        >
          {pending ? "Creation..." : "Generer"}
        </button>
      </form>

      {created.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-[var(--muted)]">
            URL a ecrire en NDEF (relire la puce ensuite pour verification) :
          </p>
          <textarea
            readOnly
            rows={Math.min(10, created.length)}
            value={created.map((c) => c.url).join("\n")}
            className="mt-2 w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] p-3 font-mono text-xs"
          />
        </div>
      )}
    </div>
  );
}
