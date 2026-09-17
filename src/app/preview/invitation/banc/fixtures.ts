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
  clos: {
    label: "Réponses closes",
    event: { ...reference, rsvpSettings: { deadline: "2026-01-01T00:00:00Z" } },
    guest: { groupName: "Samuel Fotso", maxSeats: 1, guests: [{ firstName: "Samuel", isPlusOne: false }] },
  },
};
