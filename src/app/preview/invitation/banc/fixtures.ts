import type { RawInvitationEvent, RawInvitationGuest } from "@/lib/events/invitation-view";

/**
 * Cas du banc d essai des themes d invitation (plan phase 3, cahier §15.1 :
 * "tester avec nom court/long, photo absente, programme long, 2 lieux, 8 menus
 * et 10 questions").
 *
 * Donnees fabriquees, jamais lues en base : le banc tourne sur n importe quel
 * poste et ne montre aucun invite reel.
 */

const program = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    time: `${String(10 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
    label: ["Accueil des invités", "Cérémonie coutumière — remise de la dot et bénédiction des familles", "Cocktail", "Photos", "Dîner", "Ouverture du bal"][i % 6]!,
  }));

const reference: RawInvitationEvent = {
  type: "WEDDING",
  title: "Mariage de Beriole & Anna",
  hosts: "Beriole & Anna",
  startsAt: new Date("2026-12-12T13:00:00Z"),
  endsAt: null,
  timezone: "Africa/Douala",
  heroImageUrl: "/demo/cover.jpg",
  contentUpdatedAt: null,
  publishedAt: new Date("2026-09-10T09:00:00Z"),
  themeKey: "royal-ivory",
  themeSettings: {},
  rsvpSettings: { deadline: "2026-11-28T22:59:00Z" },
  venues: [
    { label: "Cérémonie", name: "Cathédrale Notre-Dame des Victoires", address: "Avenue Kennedy, Yaoundé", landmark: "Face à la poste centrale", lat: null, lng: null, startsAt: new Date("2026-12-12T13:00:00Z") },
    { label: "Réception", name: "Hilton Yaoundé — Salle des Ambassadeurs", address: "Boulevard du 20 Mai, Yaoundé", landmark: "Entrée côté jardin", lat: null, lng: null, startsAt: new Date("2026-12-12T18:00:00Z") },
  ],
  sections: [
    { id: "p", kind: "program", title: "Programme", isVisible: true, data: { items: program(4) } },
    { id: "d", kind: "dresscode", title: "Dress code", isVisible: true, data: { text: "Tenue de soirée. Les couleurs du mariage sont l’ivoire et le champagne.", palette: ["#F4EDE1", "#D8C3A5", "#8C6D46"] } },
    { id: "m", kind: "menu", title: "Menu", isVisible: true, data: { courses: [{ label: "Entrée", items: ["Velouté de potiron au gingembre"] }, { label: "Plat", items: ["Poulet DG", "Bar braisé, plantain mûr"] }, { label: "Dessert", items: ["Pièce montée et mignardises"] }] } },
    { id: "f", kind: "faq", title: "Questions pratiques", isVisible: true, data: { items: [{ q: "Les enfants sont-ils invités ?", a: "Oui, ceux mentionnés sur votre invitation." }, { q: "Y a-t-il un parking ?", a: "Parking gratuit et surveillé à l’hôtel." }] } },
  ],
};

export const BENCH_CASES: Record<string, { label: string; event: RawInvitationEvent; guest: RawInvitationGuest }> = {
  reference: {
    label: "Référence",
    event: reference,
    guest: { groupName: "Famille Ngono", maxSeats: 4, guests: [{ firstName: "Paul", isPlusOne: false }, { firstName: "Brigitte", isPlusOne: false }] },
  },
  long: {
    label: "Tout est long",
    event: {
      ...reference,
      title: "Mariage de Marie-Clémentine Nkoulou-Essomba & Jean-Baptiste Tchouameni",
      hosts: "Marie-Clémentine Nkoulou-Essomba & Jean-Baptiste Tchouameni",
      heroImageUrl: null,
      contentUpdatedAt: new Date("2026-10-03T08:00:00Z"),
      venues: [
        { ...reference.venues[0]!, name: "Paroisse Saint-Charles-Borromée de Nkolndongo, grande nef et parvis", address: "Carrefour Nkolndongo, derrière la station Tradex, montée vers le lycée bilingue, Yaoundé IV", landmark: "Portail vert, demander le catéchiste à l’entrée principale" },
        reference.venues[1]!,
      ],
      sections: [
        { id: "p", kind: "program", title: "Déroulement complet de la journée et de la soirée", isVisible: true, data: { items: program(14) } },
        { id: "m", kind: "menu", title: "Menu", isVisible: true, data: { courses: [{ label: "Buffet", items: ["Ndolè aux crevettes", "Poulet DG", "Poisson braisé", "Koki", "Eru", "Riz sauté aux légumes", "Plantain mûr frit", "Bâtons de manioc"] }] } },
        { id: "f", kind: "faq", title: "Questions pratiques", isVisible: true, data: { items: Array.from({ length: 10 }, (_, i) => ({ q: `Question ${i + 1} : peut-on venir accompagné d’une personne qui n’est pas nommée sur l’invitation reçue ?`, a: "Le nombre de places est indiqué sur votre invitation. Au-delà, merci de contacter directement les mariés avant la date limite." })) } },
        { id: "c", kind: "custom", title: null, isVisible: true, data: { text: "Supercalifragilisticexpialidociousdocumentationextraordinairementlongsansespace\n\nUn texte libre avec un mot interminable doit se couper plutôt que déborder." } },
      ],
    },
    guest: { groupName: "Famille Djeumeni Tchoua Nkoulou-Essomba et leurs enfants venus de Douala", maxSeats: 6, guests: [{ firstName: "A", isPlusOne: false }, { firstName: "B", isPlusOne: false }, { firstName: "C", isPlusOne: false }] },
  },
  minimal: {
    label: "Minimal",
    event: { ...reference, type: "BIRTHDAY", title: "Anniversaire de Maeva", hosts: "Maeva", heroImageUrl: null, rsvpSettings: {}, venues: [], sections: [] },
    guest: null,
  },
  // Une reference par collection : les themes Anniversaire, Corporate et
  // Memorial sont juges sur leurs propres donnees (titre, hote unique, sections).
  anniversaire: {
    label: "Anniversaire",
    event: {
      ...reference,
      type: "BIRTHDAY",
      title: "Les 30 ans de Maeva",
      hosts: "Maeva",
      startsAt: new Date("2026-11-07T19:00:00Z"),
      rsvpSettings: { deadline: "2026-10-30T22:59:00Z" },
      venues: [{ label: "Soirée", name: "Rooftop du Djeuga Palace", address: "Rue Joseph Essono Balla, Yaoundé", landmark: "Accès par le parking arrière", lat: null, lng: null, startsAt: new Date("2026-11-07T19:00:00Z") }],
      sections: [
        { id: "p", kind: "program", title: "Au programme", isVisible: true, data: { items: [{ time: "20:00", label: "Cocktail et DJ" }, { time: "21:30", label: "Gâteau" }, { time: "22:00", label: "Piste de danse" }] } },
        { id: "d", kind: "dresscode", title: "Dress code", isVisible: true, data: { text: "Tenue de soirée, touche de doré bienvenue.", palette: ["#111111", "#D4B067"] } },
        { id: "f", kind: "faq", title: "Questions", isVisible: true, data: { items: [{ q: "Peut-on offrir un cadeau ?", a: "Votre présence suffit. Sinon, une cagnotte sera sur place." }] } },
      ],
    },
    guest: { groupName: "Karim & Linda", maxSeats: 2, guests: [{ firstName: "Karim", isPlusOne: false }, { firstName: "Linda", isPlusOne: false }] },
  },
  entreprise: {
    label: "Corporate",
    event: {
      ...reference,
      type: "CORPORATE",
      title: "Lancement de la carte Tap 2 — soirée partenaires",
      hosts: "Tap Cameroun",
      startsAt: new Date("2026-10-15T17:30:00Z"),
      endsAt: new Date("2026-10-15T21:00:00Z"),
      rsvpSettings: { deadline: "2026-10-08T22:59:00Z" },
      venues: [{ label: "Accueil", name: "Hôtel La Falaise — Salle Wouri", address: "Rue de la Motte Piquet, Douala", landmark: "Badge à retirer à l’accueil", lat: null, lng: null, startsAt: new Date("2026-10-15T17:30:00Z") }],
      sections: [
        { id: "p", kind: "program", title: "Agenda", isVisible: true, data: { items: [{ time: "18:30", label: "Accueil et enregistrement" }, { time: "19:00", label: "Keynote — la carte Tap 2" }, { time: "19:45", label: "Démonstrations et rencontres partenaires" }, { time: "21:00", label: "Cocktail dînatoire" }] } },
        { id: "c", kind: "custom", title: "Intervenants", isVisible: true, data: { text: "Beriole Mbandjo, fondateur\nAnna Ngono, direction produit\nUn invité surprise du secteur bancaire" } },
        { id: "f", kind: "faq", title: "Informations pratiques", isVisible: true, data: { items: [{ q: "Faut-il imprimer l’invitation ?", a: "Non : votre QR d’accès sera sur votre téléphone après confirmation." }, { q: "Parking ?", a: "Parking de l’hôtel, offert sur présentation de l’invitation." }] } },
      ],
    },
    guest: { groupName: "Société Ekang Conseil", maxSeats: 2, guests: [{ firstName: "Odile", isPlusOne: false }] },
  },
  hommage: {
    label: "Memorial",
    event: {
      ...reference,
      type: "MEMORIAL",
      title: "Hommage à Marie Ngo Bell",
      hosts: "Marie Ngo Bell",
      startsAt: new Date("2026-10-24T09:00:00Z"),
      rsvpSettings: {},
      venues: [
        { label: "Levée du corps", name: "Hôpital Général de Douala", address: "Boulevard de la République, Douala", landmark: null, lat: null, lng: null, startsAt: new Date("2026-10-24T07:00:00Z") },
        { label: "Messe", name: "Cathédrale Saints-Pierre-et-Paul de Bonadibong", address: "Bonanjo, Douala", landmark: null, lat: null, lng: null, startsAt: new Date("2026-10-24T09:00:00Z") },
      ],
      sections: [
        { id: "c", kind: "custom", title: null, isVisible: true, data: { text: "La famille Ngo Bell vous remercie de votre présence et de vos prières. Ni fleurs ni couronnes : un don à l’orphelinat de Bonabéri sera possible sur place." } },
        { id: "p", kind: "program", title: "Déroulement", isVisible: true, data: { items: [{ time: "07:00", label: "Levée du corps" }, { time: "09:00", label: "Messe de requiem" }, { time: "11:00", label: "Inhumation au cimetière de Bonamouti" }, { time: "13:00", label: "Repas familial" }] } },
      ],
    },
    guest: { groupName: "Famille Ekwalla", maxSeats: 3, guests: [{ firstName: "Pierre", isPlusOne: false }, { firstName: "Solange", isPlusOne: false }] },
  },
  clos: {
    label: "Réponses closes",
    event: { ...reference, rsvpSettings: { deadline: "2026-01-01T00:00:00Z" } },
    guest: { groupName: "Samuel Fotso", maxSeats: 1, guests: [{ firstName: "Samuel", isPlusOne: false }] },
  },
};
