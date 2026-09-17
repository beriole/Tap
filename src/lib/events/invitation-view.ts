import { getInvitationTheme, resolveThemeSettings } from "@/config/invitation-themes";
import { sectionSchema } from "@/lib/validations/event";
import type { DateParts, InvitationView } from "@/types/invitation";

/**
 * Construction de l InvitationView a partir de donnees deja chargees.
 *
 * Logique pure (testee dans invitation-view.test.ts) : le chargement Prisma
 * vit dans server/events/invitation-view.ts. On peut ainsi rendre un theme
 * avec des donnees fabriquees - banc d essai, cas limites - sans base.
 */

export type RawInvitationEvent = {
  /** Facultatif : un evenement CLOS ferme les reponses, quelle que soit la date limite */
  status?: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  type: InvitationView["event"]["type"];
  title: string;
  hosts: string;
  startsAt: Date;
  endsAt: Date | null;
  timezone: string;
  heroImageUrl: string | null;
  contentUpdatedAt: Date | null;
  publishedAt: Date | null;
  themeKey: string;
  themeSettings: unknown;
  rsvpSettings: unknown;
  venues: {
    label: string;
    name: string;
    address: string;
    landmark: string | null;
    lat: number | null;
    lng: number | null;
    startsAt: Date | null;
  }[];
  sections: { id: string; kind: string; title: string | null; isVisible: boolean; data: unknown }[];
};

export type RawInvitationGuest = {
  groupName: string;
  maxSeats: number;
  guests: { firstName: string | null; isPlusOne: boolean }[];
} | null;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function dateParts(date: Date, timeZone: string): DateParts {
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("fr-FR", { timeZone, ...options }).format(date);
  const time = new Intl.DateTimeFormat("fr-FR", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .format(date)
    .replace(":", " h ");
  return {
    weekday: part({ weekday: "long" }),
    day: part({ day: "numeric" }),
    month: part({ month: "long" }),
    year: part({ year: "numeric" }),
    time,
    long: part({ weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    iso: date.toISOString(),
  };
}

/** "Beriole & Anna", "Beriole et Anna" → ["Beriole", "Anna"] ; sinon un seul element. */
export function splitHosts(hosts: string): string[] {
  const parts = hosts
    .split(/\s+(?:&|et|and)\s+|\s*&\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length === 2 ? parts : [hosts.trim()];
}

function directionsUrl(venue: RawInvitationEvent["venues"][number]): string {
  const query = venue.lat !== null && venue.lng !== null ? `${venue.lat},${venue.lng}` : `${venue.name}, ${venue.address}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

/** Jours calendaires restants, comptes dans le fuseau du lieu. */
export function daysUntil(target: Date, now: Date, timeZone: string): number | null {
  const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);
  const diff = Math.round((Date.parse(dayKey(target)) - Date.parse(dayKey(now))) / 86_400_000);
  return diff < 0 ? null : diff;
}

export function buildInvitationView(
  event: RawInvitationEvent,
  guest: RawInvitationGuest,
  options: { preview: boolean; now?: Date; envelope?: boolean; themeOverride?: { key?: string; settings?: unknown } },
): InvitationView {
  const now = options.now ?? new Date();
  const tz = event.timezone;
  const themeKey = getInvitationTheme(options.themeOverride?.key ?? event.themeKey).key;
  const rsvpSettings = (event.rsvpSettings && typeof event.rsvpSettings === "object" ? event.rsvpSettings : {}) as {
    deadline?: string;
  };
  const deadline = rsvpSettings.deadline && !Number.isNaN(Date.parse(rsvpSettings.deadline)) ? new Date(rsvpSettings.deadline) : null;

  // Le bandeau "mis a jour" n a de sens que pour un changement POSTERIEUR a la publication.
  const updated =
    event.contentUpdatedAt && event.publishedAt && event.contentUpdatedAt > event.publishedAt
      ? `Mis à jour le ${new Intl.DateTimeFormat("fr-FR", { timeZone: tz, day: "numeric", month: "long" }).format(event.contentUpdatedAt)}`
      : null;

  return {
    event: {
      type: event.type,
      title: event.title,
      hosts: event.hosts,
      hostParts: splitHosts(event.hosts),
      starts: dateParts(event.startsAt, tz),
      ends: event.endsAt ? dateParts(event.endsAt, tz) : null,
      heroImageUrl: event.heroImageUrl,
      updatedNote: updated,
      daysLeft: daysUntil(event.startsAt, now, tz),
    },
    venues: event.venues.map((v) => ({
      label: v.label,
      name: v.name,
      address: v.address,
      landmark: v.landmark,
      time: v.startsAt ? dateParts(v.startsAt, tz).time : null,
      directionsUrl: directionsUrl(v),
    })),
    // Une section masquee ou devenue invalide n arrive jamais au theme.
    sections: event.sections.flatMap((s) => {
      if (!s.isVisible) return [];
      const parsed = sectionSchema.safeParse({ kind: s.kind, title: s.title, isVisible: s.isVisible, data: s.data });
      return parsed.success ? [{ ...parsed.data, id: s.id, title: parsed.data.title ?? null }] : [];
    }),
    guest: guest
      ? {
          groupName: guest.groupName,
          seats: guest.maxSeats,
          firstNames: guest.guests.filter((g) => !g.isPlusOne && g.firstName).map((g) => capitalize(g.firstName!)),
        }
      : null,
    rsvp: {
      deadline: deadline ? dateParts(deadline, tz) : null,
      closed: event.status === "CLOSED" || (deadline ? deadline < now : false),
    },
    theme: {
      key: themeKey,
      settings: resolveThemeSettings(themeKey, options.themeOverride?.settings ?? event.themeSettings),
    },
    preview: options.preview,
    envelope: options.envelope ?? false,
  };
}
