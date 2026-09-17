"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Surface } from "@/components/app/ui";
import { EVENT_TIMEZONES } from "@/lib/events/time";
import { cn } from "@/lib/utils";
import { Button, FormMessage, sendJson } from "./form-kit";
import {
  EVENT_TYPE_OPTIONS,
  EventInfoFields,
  emptyVenue,
  fieldErrors,
  infoPayload,
  VenueFields,
  venuesPayload,
  type EventInfoDraft,
  type VenueDraft,
} from "./event-fields";

/**
 * Creation guidee d un evenement (plan, phase 2 - objectif §2.1 : publiable
 * en moins de 15 minutes).
 *
 * Trois etapes seulement. Tout ce qui n est pas indispensable pour inviter -
 * programme, menu, dress code, design - se complete ensuite, depuis l ecran
 * de l evenement : demander tout d un coup, c est perdre l organisateur avant
 * qu il ait ajoute un seul invite.
 */

const STEPS = ["L essentiel", "Les lieux", "Verifier"] as const;

export function EventWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState<EventInfoDraft>({
    type: "WEDDING",
    title: "",
    hosts: "",
    startsAt: "",
    endsAt: "",
    timezone: "Africa/Douala",
    capacity: "",
  });
  const [titleTouched, setTitleTouched] = useState(false);
  const [venues, setVenues] = useState<VenueDraft[]>([emptyVenue("Ceremonie")]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** Controle local de l etape 1 : on ne laisse pas avancer vers un echec certain. */
  function checkEssentials(): boolean {
    const next: Record<string, string> = {};
    if (info.hosts.trim().length < 2) next.hosts = "Qui invite ?";
    if (info.title.trim().length < 3) next.title = "Donnez un titre a l evenement.";
    if (!info.startsAt) next.startsAt = "Date et heure du debut requises.";
    if (info.endsAt && info.startsAt && info.endsAt <= info.startsAt) next.endsAt = "La fin doit suivre le debut.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function create() {
    setBusy(true);
    setError(null);
    const result = await sendJson<{ id: string }>("/api/organizer/events", "POST", {
      ...infoPayload(info),
      venues: venuesPayload(venues),
    });
    if (!result.ok) {
      const byField = fieldErrors(result.issues);
      setErrors(byField);
      setError(result.error);
      // Une erreur sur les informations renvoie a l etape qui les porte.
      if (Object.keys(byField).some((k) => !k.startsWith("venues"))) setStep(0);
      else if (Object.keys(byField).length) setStep(1);
      setBusy(false);
      return;
    }
    router.push(`/dashboard/events/${result.data.id}/invites?nouveau=1`);
  }

  const incompleteVenue = venues.some((v) => (v.name.trim() || v.address.trim()) && !(v.name.trim() && v.address.trim()));
  const typeLabel = EVENT_TYPE_OPTIONS.find((o) => o.value === info.type)?.label;
  const tzLabel = EVENT_TIMEZONES.find((t) => t.value === info.timezone)?.label;
  const filledVenues = venuesPayload(venues);

  return (
    <Surface>
      <ol className="mb-7 flex gap-2" aria-label="Etapes">
        {STEPS.map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? "step" : undefined}
            className={cn(
              "flex flex-1 items-center gap-2 border-t-2 pt-2 text-[0.76rem]",
              index <= step ? "border-[var(--brand-copper)] text-[var(--foreground)]" : "border-[var(--console-hairline)] text-[var(--muted)]",
            )}
          >
            <span className="tabular-nums">{index + 1}</span>
            <span className={cn(index !== step && "hidden sm:inline")}>{label}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <EventInfoFields
          draft={info}
          errors={errors}
          titleTouched={titleTouched}
          onChange={(next, touched) => {
            setInfo(next);
            if (touched) setTitleTouched(true);
          }}
        />
      )}

      {step === 1 && (
        <>
          <p className="mb-4 text-[0.88rem] text-[var(--muted)]">
            Ou se passe l evenement ? Vous pourrez en ajouter ou les modifier plus tard.
          </p>
          <VenueFields venues={venues} onChange={setVenues} />
          {incompleteVenue && (
            <p className="mt-3 text-[0.8rem] text-[var(--state-warn)]">Chaque lieu a besoin d un nom et d une adresse.</p>
          )}
        </>
      )}

      {step === 2 && (
        <dl className="grid gap-x-6 gap-y-4 text-[0.9rem] sm:grid-cols-[10rem_1fr]">
          <dt className="text-[var(--muted)]">Evenement</dt>
          <dd>
            <strong>{info.title}</strong> · {typeLabel}
          </dd>
          <dt className="text-[var(--muted)]">Quand</dt>
          <dd>
            {info.startsAt.replace("T", " a ")}
            {info.endsAt && ` → ${info.endsAt.replace("T", " a ")}`}
            <span className="block text-[0.8rem] text-[var(--muted)]">{tzLabel}</span>
          </dd>
          <dt className="text-[var(--muted)]">Lieux</dt>
          <dd>
            {filledVenues.length === 0
              ? "Aucun pour l instant"
              : filledVenues.map((v) => (
                  <span key={`${v.label}-${v.name}`} className="block">
                    {v.label} · {v.name}
                  </span>
                ))}
          </dd>
          {info.capacity && (
            <>
              <dt className="text-[var(--muted)]">Capacite</dt>
              <dd>{info.capacity} personnes</dd>
            </>
          )}
        </dl>
      )}

      {error && (
        <div className="mt-5">
          <FormMessage tone="error">{error}</FormMessage>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-between gap-3">
        {step > 0 ? (
          <Button variant="secondary" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="size-4" aria-hidden /> Retour
          </Button>
        ) : (
          <span />
        )}
        {step < 2 ? (
          <Button
            disabled={step === 1 && incompleteVenue}
            onClick={() => {
              if (step === 0 && !checkEssentials()) return;
              setError(null);
              setStep(step + 1);
            }}
          >
            Continuer <ArrowRight className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button busy={busy} onClick={create}>
            <Check className="size-4" aria-hidden /> Creer et ajouter les invites
          </Button>
        )}
      </div>
    </Surface>
  );
}
