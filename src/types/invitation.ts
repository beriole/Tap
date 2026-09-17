import type { InvitationThemeKey, InvitationThemeSettings } from "@/config/invitation-themes";
import type { SectionInput } from "@/lib/validations/event";

/**
 * CONTRAT UNIQUE des themes d invitation.
 *
 * Construit cote serveur (lib/events/invitation-view.ts) et passe en lecture
 * seule au theme. Il ne contient QUE ce que l invite a le droit de voir : ni
 * note interne, ni autre groupe, ni jeton, ni allergie. Un theme ne peut donc
 * pas afficher par erreur ce qu il ne recoit pas.
 *
 * Les dates arrivent deja formatees dans le fuseau du lieu : un theme n a pas
 * a connaitre Intl ni les fuseaux, et deux themes ne peuvent pas afficher
 * deux heures differentes pour le meme evenement.
 */

export type DateParts = {
  /** "samedi" */
  weekday: string;
  /** "12" */
  day: string;
  /** "decembre" */
  month: string;
  /** "2026" */
  year: string;
  /** "14 h 00" */
  time: string;
  /** "samedi 12 decembre 2026" */
  long: string;
  iso: string;
};

export type InvitationVenue = {
  label: string;
  name: string;
  address: string;
  landmark: string | null;
  time: string | null;
  /** Lien d itineraire construit a partir de l adresse ou des coordonnees */
  directionsUrl: string;
};

export type InvitationSection = SectionInput & { id: string; title: string | null };

export type InvitationView = {
  event: {
    type: "WEDDING" | "BIRTHDAY" | "CORPORATE" | "MEMORIAL" | "OTHER";
    title: string;
    hosts: string;
    /** Les hotes decoupes sur "&" / "et" : ["Beriole", "Anna"] */
    hostParts: string[];
    starts: DateParts;
    ends: DateParts | null;
    heroImageUrl: string | null;
    /** "Mis a jour le 3 octobre" - null si jamais modifie apres publication */
    updatedNote: string | null;
    /** Jours avant l evenement ; null s il est passe */
    daysLeft: number | null;
  };
  venues: InvitationVenue[];
  sections: InvitationSection[];
  /** null en apercu organisateur : aucun invite reel */
  guest: {
    groupName: string;
    seats: number;
    /** Prenoms, pour "Cher Paul, chere Brigitte" */
    firstNames: string[];
  } | null;
  rsvp: {
    deadline: DateParts | null;
    closed: boolean;
  };
  theme: {
    key: InvitationThemeKey;
    settings: InvitationThemeSettings;
  };
  /** Apercu : aucun lien actif, aucun enregistrement */
  preview: boolean;
};
