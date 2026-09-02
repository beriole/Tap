"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { ACCENT_PALETTE, THEMES, type ThemeMedia } from "@/config/themes";
import { PhoneFrame } from "@/components/marketing/phone";
import { SectionTitle, Surface } from "@/components/app/ui";
import { cn } from "@/lib/utils";

type Mode = "LIGHT" | "DARK" | "AUTO";
type ButtonStyle = "SOLID" | "OUTLINE" | "PILL" | "ICON_TEXT";

const MEDIA_LABEL: Record<ThemeMedia, string> = {
  avatar: "Photo",
  cover: "Couverture",
  logo: "Logo",
};

/**
 * §6.2 + Regle UX - "Le client personnalise son identite, mais ne doit pas
 * pouvoir casser le design." Tous les choix sont des enumerations fermees,
 * revalidees serveur par lib/validations/theme.ts.
 *
 * L apercu est une iframe vers /preview/theme : elle rend le theme REEL avec
 * les donnees REELLES du client. Selectionner ne publie rien - il faut appuyer
 * sur Appliquer. On essaye, puis on decide.
 */
export function ThemePicker({
  currentKey,
  accentColor,
  mode,
  buttonStyle,
  media,
}: {
  currentKey: string;
  accentColor: string;
  mode: Mode;
  buttonStyle: ButtonStyle;
  /** Medias reellement charges par le client, pour signaler ce qui manque. */
  media: { avatar: boolean; cover: boolean; logo: boolean };
}) {
  const router = useRouter();
  const [selection, setSelection] = useState({
    themeKey: currentKey,
    accentColor,
    mode,
    buttonStyle,
  });
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const active = THEMES.find((t) => t.key === selection.themeKey) ?? THEMES[0];
  const dirty =
    selection.themeKey !== currentKey ||
    selection.accentColor !== accentColor ||
    selection.mode !== mode ||
    selection.buttonStyle !== buttonStyle;

  const previewSrc = useMemo(() => {
    const p = new URLSearchParams({
      key: selection.themeKey,
      accent: selection.accentColor,
      mode: selection.mode,
      button: selection.buttonStyle,
    });
    return `/preview/theme?${p.toString()}`;
  }, [selection]);

  function apply() {
    startTransition(async () => {
      const response = await fetch("/api/profile/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...selection, customConfig: {} }),
      });
      if (response.ok) {
        setMessage({ ok: true, text: "Theme applique. Votre carte affiche deja le nouveau rendu." });
        router.refresh();
        return;
      }
      const body = await response.json().catch(() => null);
      setMessage({ ok: false, text: body?.error ?? "Ce theme n est pas disponible." });
    });
  }

  /** Medias attendus par le theme mais absents du profil. */
  const missing = active.uses.filter((m) => !media[m]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
      <div className="space-y-5 lg:order-1">
        <Surface padded={false} className="p-5">
          <SectionTitle>Theme</SectionTitle>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {THEMES.map((theme) => {
              const isActive = selection.themeKey === theme.key;
              return (
                <li key={theme.key}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelection((s) => ({
                        ...s,
                        themeKey: theme.key,
                        mode: theme.defaultMode,
                        accentColor: theme.defaultAccent,
                      }))
                    }
                    className={cn(
                      "w-full rounded-xl border p-3.5 text-left transition-colors",
                      isActive
                        ? "border-[var(--brand-copper)] bg-[var(--surface)]"
                        : "border-[var(--border)] hover:border-[var(--muted)]",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="size-3 rounded-full ring-2 ring-black/5"
                          style={{ background: theme.defaultAccent }}
                        />
                        <span className="text-[0.9rem] font-semibold">{theme.name}</span>
                      </span>
                      {isActive && <Check className="size-4 text-[var(--brand-copper-deep)]" />}
                    </span>

                    <span className="mt-1.5 block text-[0.75rem] leading-snug text-[var(--muted)]">
                      {theme.target}
                    </span>

                    {/* Ce que le theme affiche vraiment : evite de televerser
                        une couverture pour un theme qui n en montre aucune. */}
                    <span className="mt-2 flex flex-wrap gap-1">
                      {theme.uses.map((m) => (
                        <span
                          key={m}
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[0.62rem] font-medium",
                            media[m]
                              ? "bg-[var(--surface)] text-[var(--muted)]"
                              : "bg-amber-50 text-amber-700",
                          )}
                        >
                          {MEDIA_LABEL[m]}
                        </span>
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Surface>

        <Surface>
          <SectionTitle>Couleur d accent</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {ACCENT_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={color}
                onClick={() => setSelection((s) => ({ ...s, accentColor: color }))}
                style={{ background: color }}
                className={cn(
                  "size-8 rounded-full ring-offset-2 ring-offset-[var(--background)] transition-transform hover:scale-110",
                  selection.accentColor === color && "ring-2 ring-[var(--foreground)]",
                )}
              />
            ))}
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <SectionTitle>Mode</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {(["LIGHT", "DARK", "AUTO"] as Mode[]).map((value) => (
                  <Chip
                    key={value}
                    active={selection.mode === value}
                    onClick={() => setSelection((s) => ({ ...s, mode: value }))}
                  >
                    {value === "LIGHT" ? "Clair" : value === "DARK" ? "Sombre" : "Auto"}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>Boutons</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {(["SOLID", "OUTLINE", "PILL", "ICON_TEXT"] as ButtonStyle[]).map((value) => (
                  <Chip
                    key={value}
                    active={selection.buttonStyle === value}
                    onClick={() => setSelection((s) => ({ ...s, buttonStyle: value }))}
                  >
                    {value === "SOLID"
                      ? "Plein"
                      : value === "OUTLINE"
                        ? "Contour"
                        : value === "PILL"
                          ? "Pilule"
                          : "Icone"}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </Surface>
      </div>

      {/* Apercu colle en haut : il suit la selection pendant qu on parcourt
          la liste, sans qu il faille remonter. */}
      <div className="lg:sticky lg:top-8 lg:order-2">
        <PhoneFrame width={264} height={536}>
          <iframe
            key={previewSrc}
            src={previewSrc}
            title="Apercu du theme"
            className="size-full border-0"
            style={{ width: 390, height: 536 / (264 / 390) }}
          />
        </PhoneFrame>

        <div className="mt-4 w-[280px]">
          {missing.length > 0 && (
            <p className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[0.75rem] leading-snug text-amber-800">
              <ImageIcon className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {active.name} met en avant {missing.map((m) => MEDIA_LABEL[m].toLowerCase()).join(" et ")}.
                Ajoutez {missing.length > 1 ? "ces images" : "cette image"} dans Profil pour en
                profiter.
              </span>
            </p>
          )}

          <button
            type="button"
            onClick={apply}
            disabled={pending || !dirty}
            className="tap-target w-full justify-center rounded-xl bg-[var(--brand-ink)] px-6 text-[0.9rem] font-semibold text-[var(--brand-paper)] disabled:opacity-45"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Application...
              </>
            ) : dirty ? (
              "Appliquer ce theme"
            ) : (
              "Theme actuel"
            )}
          </button>

          {dirty && (
            <button
              type="button"
              onClick={() => setSelection({ themeKey: currentKey, accentColor, mode, buttonStyle })}
              className="mt-2 flex w-full items-center justify-center gap-1.5 text-[0.78rem] text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <RefreshCw className="size-3.5" /> Revenir au theme actuel
            </button>
          )}

          {message && (
            <p
              className={cn(
                "mt-3 text-[0.8rem] leading-snug",
                message.ok ? "text-emerald-700" : "text-red-600",
              )}
            >
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({
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
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-[0.78rem] transition-colors",
        active
          ? "border-[var(--brand-copper)] bg-[var(--surface)] font-medium"
          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]",
      )}
    >
      {children}
    </button>
  );
}
