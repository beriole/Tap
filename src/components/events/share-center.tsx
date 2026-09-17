"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Link2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  ShieldOff,
  X,
} from "lucide-react";
import { Pill, SectionTitle, Surface } from "@/components/app/ui";
import {
  DEFAULT_SHARE_TEMPLATE,
  renderShareMessage,
  SHARE_PLACEHOLDERS,
  whatsappShareUrl,
  type ShareVariables,
} from "@/lib/events/share";
import { cn } from "@/lib/utils";
import { Button, FormMessage, sendJson, TextArea } from "./form-kit";

/**
 * Distribution des invitations (cahier §11, plan phase 6).
 *
 * Au MVP, l envoi est ASSISTE : on ouvre WhatsApp avec le message et le lien
 * deja ecrits, l organisateur appuie sur Envoyer dans sa propre application,
 * puis confirme ici. Rien ne part tout seul, rien ne coute, aucun numero n est
 * bloque pour envoi de masse.
 *
 * Le mode "a la suite" enchaine les groupes sans quitter l ecran : c est la
 * seule facon realiste de partager 150 invitations un soir.
 */

export type ShareRow = {
  groupId: string;
  name: string;
  greeting: string;
  phoneE164: string | null;
  phoneDisplay: string | null;
  state: "CREATED" | "SHARED" | "OPENED" | "RESPONDED" | "REVOKED";
  rsvpStatus: "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE";
  link: string;
};

const STATE: Record<ShareRow["state"], { label: string; tone: "live" | "warn" | "stop" | "idle" }> =
  {
    CREATED: { label: "A envoyer", tone: "warn" },
    SHARED: { label: "Envoyee", tone: "idle" },
    OPENED: { label: "Ouverte", tone: "live" },
    RESPONDED: { label: "Repondue", tone: "live" },
    REVOKED: { label: "Lien revoque", tone: "stop" },
  };

const FILTERS = [
  { key: "todo", label: "A envoyer", test: (r: ShareRow) => r.state === "CREATED" },
  { key: "unopened", label: "Envoyees, pas ouvertes", test: (r: ShareRow) => r.state === "SHARED" },
  { key: "noreply", label: "Ouvertes, sans reponse", test: (r: ShareRow) => r.state === "OPENED" },
  { key: "all", label: "Toutes", test: (r: ShareRow) => r.state !== "REVOKED" },
  { key: "revoked", label: "Revoquees", test: (r: ShareRow) => r.state === "REVOKED" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShareCenter({
  eventId,
  rows: initialRows,
  template: savedTemplate,
  vars,
}: {
  eventId: string;
  rows: ShareRow[];
  template: string | null;
  vars: Omit<ShareVariables, "prenom" | "lien">;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [template, setTemplate] = useState(savedTemplate ?? DEFAULT_SHARE_TEMPLATE);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>(
    initialRows.some((r) => r.state === "CREATED") ? "todo" : "all",
  );
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [queue, setQueue] = useState<{ ids: string[]; index: number; opened: boolean } | null>(
    null,
  );

  const messageFor = (row: ShareRow) =>
    renderShareMessage(template, { ...vars, prenom: row.greeting, lien: row.link });
  const counts = useMemo(
    () =>
      Object.fromEntries(FILTERS.map((f) => [f.key, rows.filter(f.test).length])) as Record<
        FilterKey,
        number
      >,
    [rows],
  );
  const visible = useMemo(() => {
    const test = FILTERS.find((f) => f.key === filter)!.test;
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        test(r) &&
        (!q ||
          r.name.toLowerCase().includes(q) ||
          (r.phoneE164 ?? "").includes(q.replace(/\D/g, "") || "§")),
    );
  }, [rows, filter, query]);

  function patch(groupId: string, update: Partial<ShareRow>) {
    setRows((current) => current.map((r) => (r.groupId === groupId ? { ...r, ...update } : r)));
  }

  async function linkAction(row: ShareRow, action: "shared" | "revoke" | "regenerate") {
    const result = await sendJson<{ state: ShareRow["state"]; token?: string }>(
      `/api/organizer/events/${eventId}/groups/${row.groupId}/link`,
      "POST",
      { action },
    );
    if (!result.ok) {
      setNotice({ tone: "error", text: result.error });
      return false;
    }
    patch(row.groupId, {
      state: result.data.state,
      ...(result.data.token
        ? { link: row.link.replace(/\/i\/[^/?#]+$/, `/i/${result.data.token}`) }
        : {}),
    });
    return true;
  }

  async function saveTemplate() {
    const result = await sendJson(`/api/organizer/events/${eventId}/share-template`, "PUT", {
      template: template.trim() === DEFAULT_SHARE_TEMPLATE ? null : template,
    });
    setTemplateMessage(result.ok ? "Modele enregistre." : result.error);
  }

  // ----------------------------------------------------------- A LA SUITE --
  if (queue) {
    const row = rows.find((r) => r.groupId === queue.ids[queue.index]);
    const finish = () => {
      setQueue(null);
      router.refresh();
    };
    if (!row) {
      return (
        <Surface className="text-center">
          <p className="font-[family-name:var(--font-display)] text-[1.2rem] font-semibold">
            File terminee
          </p>
          <p className="mt-2 text-[0.88rem] text-[var(--muted)]">
            {queue.ids.length} groupe(s) parcouru(s).
          </p>
          <Button className="mt-5" onClick={finish}>
            Revenir a la liste
          </Button>
        </Surface>
      );
    }
    const advance = () => setQueue({ ...queue, index: queue.index + 1, opened: false });
    return (
      <Surface>
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-[0.78rem] tabular-nums text-[var(--muted)]">
            {queue.index + 1} / {queue.ids.length}
          </span>
          <Button variant="ghost" onClick={finish}>
            <X className="size-4" aria-hidden /> Arreter
          </Button>
        </div>
        <div
          aria-hidden
          className="mb-5 h-1 overflow-hidden rounded-full bg-[var(--console-paper)]"
        >
          <div
            className="h-full bg-[var(--brand-copper)] transition-[width]"
            style={{ width: `${(queue.index / queue.ids.length) * 100}%` }}
          />
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-[1.3rem] font-semibold">
          {row.name}
        </h2>
        <p className="mt-1 text-[0.86rem] text-[var(--muted)]">
          {row.phoneDisplay ?? "Sans numero : WhatsApp vous laissera choisir le contact"}
        </p>
        <pre className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-[var(--console-paper)] p-4 font-[family-name:var(--font-sans)] text-[0.88rem] leading-relaxed">
          {messageFor(row)}
        </pre>
        <div className="mt-5 flex flex-wrap gap-2">
          {queue.opened ? (
            <Button
              onClick={async () => {
                if (await linkAction(row, "shared")) advance();
              }}
            >
              <Check className="size-4" aria-hidden /> C est envoye, suivant
            </Button>
          ) : (
            <a
              href={whatsappShareUrl(row.phoneE164, messageFor(row))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setQueue({ ...queue, opened: true })}
              className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-[#1FA855] px-5 text-[0.87rem] font-semibold text-white"
            >
              <MessageCircle className="size-4" aria-hidden /> Ouvrir WhatsApp
            </a>
          )}
          <Button variant="secondary" onClick={advance}>
            Passer
          </Button>
        </div>
      </Surface>
    );
  }

  // ---------------------------------------------------------------- LISTE --
  return (
    <div className="space-y-5">
      <Surface>
        <SectionTitle
          hint={
            <button
              type="button"
              onClick={() => setTemplateOpen(!templateOpen)}
              className="underline underline-offset-4"
            >
              {templateOpen ? "Fermer" : "Modifier le message"}
            </button>
          }
        >
          Message envoye
        </SectionTitle>
        {templateOpen ? (
          <div className="space-y-3">
            <TextArea
              aria-label="Modele du message"
              rows={6}
              value={template}
              maxLength={1000}
              onChange={(e) => setTemplate(e.target.value)}
            />
            <p className="flex flex-wrap gap-1.5 text-[0.76rem] text-[var(--muted)]">
              {SHARE_PLACEHOLDERS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setTemplate(`${template}{${p.key}}`)}
                  className="rounded-md bg-[var(--console-paper)] px-2 py-1 font-[family-name:var(--font-mono)]"
                  title={p.label}
                >
                  {`{${p.key}}`}
                </button>
              ))}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={saveTemplate}>Enregistrer le modele</Button>
              <Button variant="ghost" onClick={() => setTemplate(DEFAULT_SHARE_TEMPLATE)}>
                Revenir au message par defaut
              </Button>
              {templateMessage && (
                <FormMessage tone={templateMessage.includes("enregistre") ? "success" : "error"}>
                  {templateMessage}
                </FormMessage>
              )}
            </div>
          </div>
        ) : null}
        {rows[0] && (
          <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-[var(--console-paper)] p-4 font-[family-name:var(--font-sans)] text-[0.86rem] leading-relaxed text-[var(--muted)]">
            {messageFor(rows[0])}
          </pre>
        )}
      </Surface>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
          role="group"
          aria-label="Filtrer"
        >
          <div className="flex w-max gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[0.8rem] transition-colors",
                  filter === f.key
                    ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-paper)]"
                    : "border-[var(--console-hairline)] bg-[var(--console-card)] text-[var(--muted)] hover:text-[var(--foreground)]",
                )}
              >
                {f.label} <span className="tabular-nums opacity-70">{counts[f.key]}</span>
              </button>
            ))}
          </div>
        </div>
        {visible.filter((r) => r.state !== "REVOKED").length > 0 && (
          <Button
            onClick={() =>
              setQueue({
                ids: visible.filter((r) => r.state !== "REVOKED").map((r) => r.groupId),
                index: 0,
                opened: false,
              })
            }
          >
            <Send className="size-4" aria-hidden /> Envoyer a la suite (
            {visible.filter((r) => r.state !== "REVOKED").length})
          </Button>
        )}
      </div>

      <label className="relative block sm:w-80">
        <span className="sr-only">Rechercher</span>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom ou numero"
          className="w-full rounded-xl border border-[var(--console-hairline)] bg-[var(--console-card)] py-2.5 pl-10 pr-3.5 text-[1rem] outline-none focus:border-[var(--brand-copper)] sm:text-[0.9rem]"
        />
      </label>

      {notice && <FormMessage tone={notice.tone}>{notice.text}</FormMessage>}

      {visible.length === 0 ? (
        <p className="py-8 text-center text-[0.88rem] text-[var(--muted)]">
          Rien dans cette liste.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((row) => {
            const state = STATE[row.state];
            const revoked = row.state === "REVOKED";
            return (
              <li key={row.groupId}>
                <Surface padded={false} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="min-w-0 break-words font-[family-name:var(--font-display)] text-[1rem] font-semibold">
                          {row.name}
                        </h3>
                        <Pill tone={state.tone}>{state.label}</Pill>
                      </div>
                      <p className="mt-1 text-[0.8rem] text-[var(--muted)]">
                        {row.phoneDisplay ?? "Sans numero"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {revoked ? (
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            if (await linkAction(row, "regenerate"))
                              setNotice({
                                tone: "success",
                                text: `Lien regenere pour « ${row.name} ». L ancien ne fonctionne plus.`,
                              });
                          }}
                        >
                          <RefreshCw className="size-4" aria-hidden /> Nouveau lien
                        </Button>
                      ) : (
                        <>
                          {pending === row.groupId ? (
                            <>
                              <span className="text-[0.8rem] text-[var(--muted)]">Envoye ?</span>
                              <Button
                                onClick={async () => {
                                  if (await linkAction(row, "shared")) setPending(null);
                                }}
                              >
                                Oui
                              </Button>
                              <Button variant="ghost" onClick={() => setPending(null)}>
                                Pas encore
                              </Button>
                            </>
                          ) : (
                            <a
                              href={whatsappShareUrl(row.phoneE164, messageFor(row))}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setPending(row.groupId)}
                              aria-label={`Envoyer sur WhatsApp a ${row.name}`}
                              className="tap-target inline-flex items-center gap-2 rounded-xl bg-[#1FA855] px-4 text-[0.84rem] font-semibold text-white"
                            >
                              <MessageCircle className="size-4" aria-hidden /> WhatsApp
                            </a>
                          )}
                          <IconAction
                            label={`Copier le message pour ${row.name}`}
                            onClick={async () =>
                              setNotice(
                                (await copy(messageFor(row)))
                                  ? { tone: "success", text: "Message copie." }
                                  : { tone: "error", text: "Copie impossible sur cet appareil." },
                              )
                            }
                          >
                            <Copy className="size-4" />
                          </IconAction>
                          <IconAction
                            label={`Copier le lien de ${row.name}`}
                            onClick={async () =>
                              setNotice(
                                (await copy(row.link))
                                  ? { tone: "success", text: "Lien copie." }
                                  : { tone: "error", text: "Copie impossible sur cet appareil." },
                              )
                            }
                          >
                            <Link2 className="size-4" />
                          </IconAction>
                          <IconAction
                            label={`Revoquer le lien de ${row.name}`}
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  `Revoquer le lien de « ${row.name} » ? Il cessera immediatement de fonctionner.`,
                                )
                              )
                                return;
                              if (await linkAction(row, "revoke"))
                                setNotice({
                                  tone: "success",
                                  text: `Lien revoque pour « ${row.name} ».`,
                                });
                            }}
                          >
                            <ShieldOff className="size-4" />
                          </IconAction>
                        </>
                      )}
                    </div>
                  </div>
                </Surface>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function IconAction({
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
      aria-label={label}
      title={label}
      onClick={onClick}
      className="tap-target flex size-11 items-center justify-center rounded-xl border border-[var(--console-hairline)] text-[var(--muted)] hover:bg-[var(--console-paper)] hover:text-[var(--foreground)]"
    >
      {children}
    </button>
  );
}
