"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Check, RotateCcw, Search, Users } from "lucide-react";
import { extractTicketCode, VERDICT_LABELS, type TicketVerdict } from "@/lib/events/checkin";
import { cn } from "@/lib/utils";

/**
 * Poste d accueil (cahier §10, D6). Un telephone tenu par un proche a
 * l entree, souvent dehors, le soir, avec un reseau moyen.
 *
 * Ce qui a guide chaque choix :
 *  - le VERDICT est enorme et colore : vert on passe, orange on regarde,
 *    rouge on s arrete. Il se lit a un metre.
 *  - le scan se fait par la camera du telephone (BarcodeDetector, natif sur
 *    Android/Chrome et iOS 17+). Sans camera, la recherche par nom prend le
 *    relais - c est aussi le secours quand un invite arrive sans son QR.
 *  - la reponse tient en une requete ; l entree partielle est a un geste
 *    ("3 sur 5 sont la") ; la derniere entree s annule d un geste (doigt qui
 *    glisse).
 *  - le jeton et le PIN accompagnent chaque appel : rien n est stocke ailleurs
 *    que dans la memoire de la page.
 */

type Lookup = {
  ticketId: string;
  groupName: string;
  people: string[];
  seats: number;
  seatsUsed: number;
  verdict: TicketVerdict;
  lastCheckIn: { at: string; quantity: number; operator: string } | null;
};

type Screen = { kind: "idle" } | { kind: "ticket"; ticket: Lookup; via: "QR" | "MANUAL"; justAdmitted?: number } | { kind: "unknown" } | { kind: "results"; results: Lookup[] };

const TONE_CLASS = {
  ok: "bg-[#1F7A4D] text-white",
  warn: "bg-[#B57314] text-white",
  stop: "bg-[#A8342D] text-white",
};

async function call<T>(action: string, body: unknown): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(`/api/checkin?action=${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: res.ok, status: res.status, data: (await res.json().catch(() => null)) as T };
}

export function Station({ token }: { token: string }) {
  const [pin, setPin] = useState("");
  const [operator, setOperator] = useState("");
  const [session, setSession] = useState<{ label: string; eventTitle: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ kind: "idle" });
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(0);

  const auth = { token, pin, operatorName: operator };

  async function open(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await call<{ station: { label: string }; event: { title: string }; error?: string }>("open", auth);
    setBusy(false);
    if (!r.ok) return setError(r.data?.error ?? "Ouverture impossible.");
    setSession({ label: r.data.station.label, eventTitle: r.data.event.title });
  }

  const lookup = useCallback(
    async (scanned: string) => {
      if (busy) return;
      setBusy(true);
      const r = await call<{ ticket: Lookup | null; error?: string }>("lookup", { token, pin, scanned });
      setBusy(false);
      if (!r.ok) return setError(r.data?.error ?? "Verification impossible.");
      setError(null);
      setScreen(r.data.ticket ? { kind: "ticket", ticket: r.data.ticket, via: "QR" } : { kind: "unknown" });
      if (navigator.vibrate) navigator.vibrate(r.data.ticket ? 60 : [60, 60, 60]);
    },
    [busy, token, pin],
  );

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await call<{ results: Lookup[]; error?: string }>("lookup", { token, pin, query });
    setBusy(false);
    if (!r.ok) return setError(r.data?.error ?? "Recherche impossible.");
    setScreen({ kind: "results", results: r.data.results });
  }

  async function admit(ticket: Lookup, quantity: number, via: "QR" | "MANUAL", override = false) {
    setBusy(true);
    const r = await call<{ ok: boolean; quantity?: number; lookup?: Lookup; reason?: string; error?: string }>("admit", {
      ...auth,
      ticketId: ticket.ticketId,
      quantity,
      method: via,
      override,
    });
    setBusy(false);
    if (r.data?.lookup) {
      setScreen({ kind: "ticket", ticket: r.data.lookup, via, justAdmitted: r.data.ok ? r.data.quantity : undefined });
    }
    if (r.data?.ok) {
      setCount((c) => c + (r.data.quantity ?? 0));
      if (navigator.vibrate) navigator.vibrate(120);
    } else if (r.data?.reason === "conflict") {
      setError("Un autre poste vient d enregistrer cette entree. Situation mise a jour.");
    } else if (!r.ok && r.data?.error) {
      setError(r.data.error);
    }
  }

  async function undo(ticket: Lookup) {
    setBusy(true);
    const r = await call<{ ok: boolean; ticket: Lookup | null }>("admit", { ...auth, ticketId: ticket.ticketId, quantity: 1, method: "MANUAL", undo: true });
    setBusy(false);
    if (r.data?.ok && r.data.ticket) {
      setCount((c) => Math.max(0, c - (ticket.lastCheckIn?.quantity ?? 0)));
      setScreen({ kind: "ticket", ticket: r.data.ticket, via: "MANUAL" });
    }
  }

  // ------------------------------------------------------------ PIN --
  if (!session) {
    return (
      <form onSubmit={open} className="mx-auto flex min-h-dvh max-w-[360px] flex-col justify-center px-6 py-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#7A5D33]">Poste d’accueil</p>
        <h1 className="mt-2 text-[26px] font-medium leading-tight">Ouvrir le poste</h1>
        <label className="mt-8 block">
          <span className="mb-1.5 block text-[13px] text-[#675B52]">Votre prénom</span>
          <input value={operator} onChange={(e) => setOperator(e.target.value)} autoComplete="given-name" className={field} placeholder="Carine" />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] text-[#675B52]">Code PIN</span>
          <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" autoComplete="one-time-code" className={cn(field, "text-center text-[28px] tracking-[0.5em]")} placeholder="••••" />
        </label>
        {error && <p role="alert" className="mt-4 text-[14px] text-[#A8342D]">{error}</p>}
        <button type="submit" disabled={busy || pin.length !== 4 || operator.trim().length < 2} className={primary}>
          Ouvrir
        </button>
        <p className="mt-6 text-[13px] leading-relaxed text-[#675B52]">Le code PIN vous a été remis par l’organisateur. Votre prénom apparaîtra sur chaque entrée enregistrée.</p>
      </form>
    );
  }

  // ----------------------------------------------------------- POSTE --
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-4 pb-8 pt-[max(12px,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium">{session.eventTitle}</p>
          <p className="text-[12px] text-[#675B52]">
            {session.label} · {operator}
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-[#F6F0E4] px-3 py-1.5 text-[13px] tabular-nums" title="Entrees enregistrees sur ce poste">
          <Users className="size-3.5" aria-hidden /> {count}
        </span>
      </header>

      {screen.kind === "ticket" ? (
        <TicketCard ticket={screen.ticket} via={screen.via} justAdmitted={screen.justAdmitted} busy={busy} onAdmit={(q, o) => admit(screen.ticket, q, screen.via, o)} onUndo={() => undo(screen.ticket)} onBack={() => setScreen({ kind: "idle" })} />
      ) : screen.kind === "unknown" ? (
        <div className="mt-4 space-y-4">
          <div className={cn("rounded-2xl p-6 text-center", TONE_CLASS.stop)}>
            <p className="text-[28px] font-medium leading-tight">QR inconnu</p>
            <p className="mt-2 text-[15px] opacity-90">Ce code n’appartient pas à cet événement. Cherchez la personne par son nom.</p>
          </div>
          <button type="button" onClick={() => setScreen({ kind: "idle" })} className={secondary}>
            Retour
          </button>
        </div>
      ) : (
        <>
          <Scanner onCode={lookup} paused={busy} />
          <form onSubmit={search} className="mt-4">
            <label className="relative block">
              <span className="sr-only">Rechercher par nom ou numéro</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#675B52]" aria-hidden />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom ou numéro" className={cn(field, "pl-12")} />
            </label>
          </form>
          {screen.kind === "results" && (
            <ul className="mt-3 space-y-2">
              {screen.results.length === 0 && <li className="py-6 text-center text-[14px] text-[#675B52]">Aucun groupe attendu ne correspond.</li>}
              {screen.results.map((r) => (
                <li key={r.ticketId}>
                  <button type="button" onClick={() => setScreen({ kind: "ticket", ticket: r, via: "MANUAL" })} className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#E0D3BE] bg-white px-4 py-3 text-left">
                    <span className="min-w-0">
                      <span className="block truncate text-[16px] font-medium">{r.groupName}</span>
                      <span className="block truncate text-[13px] text-[#675B52]">{r.people.join(", ")}</span>
                    </span>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium", TONE_CLASS[VERDICT_LABELS[r.verdict.kind].tone])}>
                      {r.seatsUsed}/{r.seats}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {error && screen.kind !== "idle" && <p role="alert" className="mt-4 text-[14px] text-[#A8342D]">{error}</p>}
    </div>
  );
}

function TicketCard({ ticket, via, justAdmitted, busy, onAdmit, onUndo, onBack }: { ticket: Lookup; via: "QR" | "MANUAL"; justAdmitted?: number; busy: boolean; onAdmit: (q: number, override?: boolean) => void; onUndo: () => void; onBack: () => void }) {
  const label = VERDICT_LABELS[ticket.verdict.kind];
  const remaining = ticket.seats - ticket.seatsUsed;
  const [partial, setPartial] = useState<number | null>(null);

  return (
    <div className="mt-4 space-y-4">
      <div className={cn("rounded-2xl p-6 text-center", TONE_CLASS[label.tone])} aria-live="assertive">
        <p className="text-[13px] uppercase tracking-[0.2em] opacity-80">{justAdmitted ? `${justAdmitted} entrée${justAdmitted > 1 ? "s" : ""} enregistrée${justAdmitted > 1 ? "s" : ""}` : label.title}</p>
        <p className="mt-2 text-[30px] font-medium leading-tight [overflow-wrap:anywhere]">{ticket.groupName}</p>
        <p className="mt-2 text-[16px] opacity-90">{ticket.people.join(", ")}</p>
        <p className="mt-4 text-[44px] font-medium leading-none tabular-nums">
          {ticket.seatsUsed}<span className="text-[22px] opacity-70"> / {ticket.seats}</span>
        </p>
        <p className="mt-1 text-[13px] opacity-80">{ticket.seatsUsed === 0 ? "personne entrée" : `déjà entrée${ticket.seatsUsed > 1 ? "s" : ""}`}</p>
        {ticket.lastCheckIn && (
          <p className="mt-3 text-[12px] opacity-75">
            Dernière entrée : {ticket.lastCheckIn.quantity} par {ticket.lastCheckIn.operator}, {new Date(ticket.lastCheckIn.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {remaining > 0 && ticket.verdict.kind !== "cancelled" && ticket.verdict.kind !== "not_open" && (
        <div className="space-y-2">
          <button type="button" disabled={busy} onClick={() => onAdmit(remaining)} className={primary}>
            <Check className="size-5" aria-hidden /> Faire entrer {remaining > 1 ? `les ${remaining}` : ""}
          </button>
          {remaining > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#675B52]">Ou seulement</span>
              <div className="flex flex-1 gap-1.5">
                {Array.from({ length: Math.min(remaining - 1, 6) }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" disabled={busy} onClick={() => setPartial(n)} className={cn("min-h-11 flex-1 rounded-xl border text-[16px] tabular-nums", partial === n ? "border-[#1D1916] bg-[#1D1916] text-white" : "border-[#E0D3BE] bg-white")}>
                    {n}
                  </button>
                ))}
              </div>
              {partial !== null && (
                <button type="button" disabled={busy} onClick={() => { onAdmit(partial); setPartial(null); }} className="min-h-11 rounded-xl bg-[#1F7A4D] px-4 text-[14px] font-medium text-white">
                  OK
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {(ticket.verdict.kind === "used" || ticket.verdict.kind === "cancelled") && (
        <button
          type="button"
          disabled={busy}
          onClick={() => { if (window.confirm("Faire entrer une personne de plus, au-delà des places prévues ? Cette entrée sera signalée à l’organisateur.")) onAdmit(1, true); }}
          className={secondary}
        >
          Faire entrer quand même (signalé)
        </button>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={onBack} className={cn(secondary, "flex-1")}>
          {via === "QR" ? "Scanner le suivant" : "Retour"}
        </button>
        {ticket.lastCheckIn && (
          <button type="button" disabled={busy} onClick={onUndo} className={cn(secondary, "flex-1")} title="Annuler la dernière entrée de ce groupe">
            <RotateCcw className="size-4" aria-hidden /> Annuler la dernière
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Lecteur QR par la camera. BarcodeDetector est natif (Chrome Android, iOS 17+
 * Safari) ; ailleurs, on affiche un champ pour saisir ou coller le code.
 * Le meme code n est pas relu deux fois de suite dans la seconde : un QR
 * tenu devant la camera ne declenche pas dix verifications.
 */
function Scanner({ onCode, paused }: { onCode: (scanned: string) => void; paused: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"starting" | "on" | "unsupported" | "denied">("starting");
  const [manual, setManual] = useState("");
  const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  useEffect(() => {
    const Detector = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let stopped = false;
    const detector = new Detector({ formats: ["qr_code"] });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        setState("on");
        const tick = async () => {
          if (stopped) return;
          try {
            const codes = video.current ? await detector.detect(video.current) : [];
            const raw = codes[0]?.rawValue;
            if (raw && !paused) {
              const code = extractTicketCode(raw) ?? raw;
              const now = Date.now();
              if (code !== lastRef.current.code || now - lastRef.current.at > 3000) {
                lastRef.current = { code, at: now };
                onCode(raw);
              }
            }
          } catch {
            /* image pas prete */
          }
          timer = window.setTimeout(tick, 250);
        };
        void tick();
      } catch {
        setState("denied");
      }
    })();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onCode, paused]);

  return (
    <div className="space-y-3">
      {state === "on" || state === "starting" ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
          <video ref={video} playsInline muted className="size-full object-cover" />
          <div aria-hidden className="pointer-events-none absolute inset-[18%] rounded-xl border-2 border-white/80" />
          {state === "starting" && <p className="absolute inset-x-0 bottom-3 text-center text-[13px] text-white/80">Ouverture de la caméra…</p>}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#E0D3BE] p-4 text-[13px] text-[#675B52]">
          {state === "denied" ? <CameraOff className="size-5 shrink-0" aria-hidden /> : <Camera className="size-5 shrink-0" aria-hidden />}
          {state === "denied" ? "Caméra refusée. Autorisez-la dans le navigateur, ou cherchez par nom." : "Pas de lecteur QR sur ce navigateur : cherchez par nom, ou collez le code ci-dessous."}
        </div>
      )}
      {state !== "on" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manual.trim()) onCode(manual.trim());
            setManual("");
          }}
        >
          <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Coller le lien ou le code du QR" className={field} aria-label="Code du QR" />
        </form>
      )}
    </div>
  );
}

const field = "w-full rounded-xl border border-[#E0D3BE] bg-white px-4 py-3.5 text-[17px] text-[#1D1916] outline-none focus:border-[#7A5D33]";
const primary = "mt-2 flex min-h-[60px] w-full items-center justify-center gap-2 rounded-xl bg-[#1F7A4D] px-5 text-[17px] font-medium text-white active:scale-[0.98] disabled:opacity-50";
const secondary = "flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-[#E0D3BE] bg-white px-4 text-[15px] font-medium text-[#1D1916] active:scale-[0.98] disabled:opacity-50";
