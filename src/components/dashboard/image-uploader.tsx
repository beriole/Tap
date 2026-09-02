"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "avatar" | "cover" | "logo";

const SHAPES: Record<Kind, { label: string; hint: string; box: string }> = {
  avatar: { label: "Photo de profil", hint: "Carree, 800 px minimum", box: "size-24 rounded-full" },
  cover: { label: "Couverture", hint: "Paysage, 1600 x 900", box: "h-24 w-full rounded-xl" },
  logo: { label: "Logo", hint: "Fond transparent conseille", box: "size-24 rounded-xl" },
};

/**
 * §5.2 - Depot des medias du profil.
 *
 * Le fichier part directement vers /api/upload, qui ecrit l URL sur le profil
 * du client connecte. Le composant ne connait donc aucun identifiant de profil :
 * c est le serveur qui decide a qui appartient l image.
 */
export function ImageUploader({ kind, current }: { kind: Kind; current: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shape = SHAPES[kind];

  async function upload(file: File) {
    setBusy(true);
    setError(null);

    const body = new FormData();
    body.append("file", file);
    body.append("kind", kind);

    const response = await fetch("/api/upload", { method: "POST", body });
    const json = await response.json().catch(() => null);

    if (response.ok && json?.url) {
      setPreview(json.url);
      router.refresh();
    } else {
      setError(json?.error ?? "Envoi impossible.");
    }
    setBusy(false);
  }

  return (
    <div>
      <p className="mb-1.5 text-xs text-[var(--muted)]">{shape.label}</p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          "relative flex items-center justify-center overflow-hidden border border-dashed border-[var(--border)] bg-[var(--surface)] transition-colors hover:border-[var(--accent)] disabled:opacity-60",
          shape.box,
        )}
      >
        {preview ? (
          <Image
            src={preview}
            alt={shape.label}
            fill
            sizes="200px"
            className={kind === "logo" ? "object-contain p-2" : "object-cover"}
          />
        ) : (
          <ImagePlus className="size-5 text-[var(--muted)]" />
        )}

        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="size-5 animate-spin text-white" />
          </span>
        )}
      </button>

      <p className="mt-1 text-[0.7rem] text-[var(--muted)]">{shape.hint}</p>
      {error && <p className="mt-1 text-[0.7rem] text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
