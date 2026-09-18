"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { SectionTitle, Surface } from "@/components/app/ui";
import {
  COLLECTION_LABELS,
  collectionFor,
  getInvitationTheme,
  INVITATION_THEMES,
  themesOf,
  type InvitationCollection,
  type InvitationThemeKey,
  type InvitationThemeSettings,
} from "@/config/invitation-themes";
import { cn } from "@/lib/utils";
import { Button, FormMessage, sendJson } from "./form-kit";

/**
 * Studio de design d une invitation (plan phase 3).
 *
 * L apercu est une iframe vers /preview/invitation/[id] : le VRAI theme, avec
 * les VRAIES donnees de l evenement, a la largeur d un telephone. Chaque
 * reglage essaye est passe en parametre d URL - rien n est enregistre avant
 * le bouton. On voit "notre invitation en Nuit", pas un exemple.
 *
 * Largeurs du cahier (§12.1) proposees telles quelles : 360, 390, 430.
 */

const WIDTHS = [360, 390, 430] as const;

export function DesignStudio({
  eventId,
  themeKey: savedKey,
  settings: savedSettings,
  heroImageUrl: savedHero,
  allowedThemes,
  eventType,
}: {
  eventId: string;
  eventType: string;
  themeKey: InvitationThemeKey;
  settings: InvitationThemeSettings;
  heroImageUrl: string | null;
  allowedThemes: "all" | string[];
}) {
  const router = useRouter();
  const [themeKey, setThemeKey] = useState(savedKey);
  const [settings, setSettings] = useState(savedSettings);
  const [width, setWidth] = useState<(typeof WIDTHS)[number]>(390);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const theme = getInvitationTheme(themeKey);
  // La collection de l evenement d abord ; les autres restent accessibles (un
  // anniversaire chic peut prendre Elegant, un gala d entreprise Midnight Gold).
  const own = collectionFor(eventType);
  const collections = [own, ...(Object.keys(COLLECTION_LABELS) as InvitationCollection[]).filter((c) => c !== own)];

  const dirty = themeKey !== savedKey || JSON.stringify(settings) !== JSON.stringify(savedSettings);
  const previewSrc = `/preview/invitation/${eventId}?theme=${themeKey}&variant=${settings.variant}&accent=${settings.accent}&countdown=${settings.countdown ? 1 : 0}`;

  async function save() {
    setBusy(true);
    setMessage(null);
    const result = await sendJson(`/api/organizer/events/${eventId}/design`, "PUT", {
      themeKey,
      settings,
    });
    setBusy(false);
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    setMessage({ tone: "success", text: "Design enregistre." });
    router.refresh();
  }

  // minmax(0, ...) : sans lui, la colonne s elargit a la taille du telephone
  // d apercu, et l echelle calculee sur sa largeur ne reduit jamais rien.
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
      <div className="space-y-6">
        <Surface>
          <SectionTitle hint={`${Object.keys(INVITATION_THEMES).length} disponibles`}>
            Theme
          </SectionTitle>
          {collections.map((collection) => (
            <div key={collection} className="mb-6 last:mb-0">
              <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {COLLECTION_LABELS[collection]}
                {collection === own && <span className="ml-2 font-normal normal-case tracking-normal">· pour votre evenement</span>}
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {themesOf(collection).map((t) => {
                  const locked = allowedThemes !== "all" && !allowedThemes.includes(t.key);
                  return (
                    <li key={t.key}>
                      <button
                        type="button"
                        disabled={locked}
                        aria-pressed={themeKey === t.key}
                        onClick={() => {
                          setThemeKey(t.key);
                          setSettings(t.defaults);
                        }}
                        className={cn(
                          "w-full rounded-2xl border p-4 text-left transition-colors disabled:opacity-50",
                          themeKey === t.key
                            ? "border-[var(--brand-ink)] bg-[var(--console-paper)]"
                            : "border-[var(--console-hairline)] hover:bg-[var(--console-paper)]",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {t.variants.slice(0, 2).map((v) => (
                            <span key={v.key} className="size-5 rounded-full ring-1 ring-black/10" style={{ background: v.swatch }} />
                          ))}
                          <span className="size-5 rounded-full ring-1 ring-black/10" style={{ background: t.accents[0]!.swatch }} />
                          <span className="font-[family-name:var(--font-display)] text-[1.02rem] font-semibold">{t.name}</span>
                        </span>
                        <span className="mt-1.5 block text-[0.8rem] leading-snug text-[var(--muted)]">{t.direction}</span>
                        {locked && <span className="mt-2 block text-[0.74rem] text-[var(--state-warn)]">Offre Premium</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </Surface>

        <Surface>
          <SectionTitle>Reglages</SectionTitle>
          <div className="space-y-5">
            <Swatches
              label="Variante"
              items={theme.variants}
              value={settings.variant}
              onChange={(variant) => setSettings({ ...settings, variant })}
            />
            <Swatches
              label="Accent"
              items={theme.accents}
              value={settings.accent}
              onChange={(accent) => setSettings({ ...settings, accent })}
            />
            <label className="flex items-center gap-3 text-[0.9rem]">
              <input
                type="checkbox"
                checked={settings.countdown}
                onChange={(e) => setSettings({ ...settings, countdown: e.target.checked })}
                className="size-4 accent-[var(--brand-copper-deep)]"
              />
              Afficher le compte a rebours (« Dans 86 jours »)
            </label>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button busy={busy} disabled={!dirty} onClick={save}>
              <Check className="size-4" aria-hidden /> Enregistrer le design
            </Button>
            {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
            {dirty && !message && (
              <span className="text-[0.8rem] text-[var(--muted)]">Apercu non enregistre.</span>
            )}
          </div>
        </Surface>

        <Surface>
          <SectionTitle hint="Portrait 4:5 conseille">Photo</SectionTitle>
          <HeroUploader eventId={eventId} current={savedHero} />
        </Surface>
      </div>

      <div className="min-w-0 lg:sticky lg:top-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[0.78rem] text-[var(--muted)]">Apercu reel</span>
          <div role="group" aria-label="Largeur d ecran" className="flex gap-1">
            {WIDTHS.map((w) => (
              <button
                key={w}
                type="button"
                aria-pressed={width === w}
                onClick={() => setWidth(w)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[0.76rem] tabular-nums transition-colors",
                  width === w
                    ? "bg-[var(--brand-ink)] text-[var(--brand-paper)]"
                    : "text-[var(--muted)] hover:bg-[var(--console-paper)]",
                )}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
        <Phone src={previewSrc} width={width} />
      </div>
    </div>
  );
}

function Swatches({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: readonly { key: string; label: string; swatch: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-[0.78rem] text-[var(--muted)]">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <label
            key={item.key}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--console-hairline)] py-2 pl-2 pr-3.5 text-[0.85rem] transition-colors has-[:checked]:border-[var(--brand-ink)] has-[:checked]:bg-[var(--console-paper)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--brand-copper)]"
          >
            <input
              type="radio"
              name={label}
              value={item.key}
              checked={value === item.key}
              onChange={() => onChange(item.key)}
              className="sr-only"
            />
            <span
              className="size-6 rounded-full ring-1 ring-black/10"
              style={{ background: item.swatch }}
            />
            {item.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Deux iframes a tour de role : la nouvelle adresse charge derriere, puis
 * passe devant. Sans cela, chaque reglage montre une page blanche le temps
 * du rendu.
 */
function Phone({ src, width }: { src: string; width: number }) {
  const [slots, setSlots] = useState<{ a: string; b: string; front: "a" | "b" }>({
    a: src,
    b: "",
    front: "a",
  });
  useEffect(() => {
    setSlots((s) => (s[s.front] === src ? s : { ...s, [s.front === "a" ? "b" : "a"]: src }));
  }, [src]);
  const height = Math.round(width * 2.05);
  // Echelle tiree de la place REELLE : sur telephone, le studio n a pas 380 px.
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(380);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setRoom(Math.min(380, entry!.contentRect.width - 12)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const scale = Math.min(1, room / width);

  return (
    <div ref={box} className="w-full">
      <div
        className="mx-auto overflow-hidden rounded-[2rem] border-[6px] border-[var(--brand-ink)] bg-[var(--brand-ink)] shadow-[0_24px_60px_-30px_rgb(0_0_0/0.6)]"
        style={{ width: width * scale + 12, height: height * scale + 12 }}
      >
        <div
          className="relative origin-top-left"
          style={{ width, height, transform: `scale(${scale})` }}
        >
          {(["a", "b"] as const).map((slot) =>
            slots[slot] ? (
              <iframe
                key={slot}
                src={slots[slot]}
                title="Apercu de l invitation"
                onLoad={() =>
                  setSlots((s) => (s[slot] === src && s.front !== slot ? { ...s, front: slot } : s))
                }
                className={cn(
                  "absolute inset-0 size-full border-0 bg-white transition-opacity duration-200",
                  slots.front === slot ? "opacity-100" : "opacity-0",
                )}
              />
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}

function HeroUploader({ eventId, current }: { eventId: string; current: string | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`/api/organizer/events/${eventId}/hero`, { method: "POST", body });
    const json = await response.json().catch(() => null);
    if (response.ok && json?.url) {
      setPreview(json.url);
      router.refresh();
    } else setError(json?.error ?? "Envoi impossible.");
    setBusy(false);
  }

  async function remove() {
    setBusy(true);
    const result = await sendJson(`/api/organizer/events/${eventId}/hero`, "DELETE");
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setPreview(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label={preview ? "Remplacer la photo" : "Ajouter une photo"}
        className="relative flex aspect-[4/5] w-32 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--console-hairline)] bg-[var(--console-paper)] transition-colors hover:border-[var(--brand-copper)] disabled:opacity-60"
      >
        {preview ? (
          <Image src={preview} alt="" fill sizes="128px" className="object-cover" />
        ) : (
          <ImagePlus className="size-5 text-[var(--muted)]" aria-hidden />
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="size-5 animate-spin text-white" aria-hidden />
          </span>
        )}
      </button>
      <div className="space-y-2 text-[0.82rem] text-[var(--muted)]">
        <p>JPEG, PNG ou WebP, 8 Mo maximum. Affichee sous le premier ecran, jamais avant.</p>
        {preview && (
          <Button variant="danger" busy={busy} onClick={remove}>
            <Trash2 className="size-4" aria-hidden /> Retirer la photo
          </Button>
        )}
        {error && <FormMessage tone="error">{error}</FormMessage>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
