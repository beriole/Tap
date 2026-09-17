/**
 * SOURCE UNIQUE des totaux d un evenement.
 *
 * Dashboard, exports, controle de capacite et ecran du jour J appellent tous
 * cette fonction. C est ce qui tient deux criteres d acceptation du cahier
 * (§22) : "le dashboard reflete les reponses sans double comptage" et "les
 * exports correspondent aux totaux affiches". Deux calculs ecrits a deux
 * endroits finissent toujours par diverger.
 *
 * Logique pure : elle recoit des donnees deja chargees et ne touche jamais a
 * la base, pour etre testee exhaustivement (headcount.test.ts).
 *
 * Regles de comptage :
 *  - une personne n est ATTENDUE que si son groupe a repondu ATTENDING et
 *    qu elle-meme est marquee `attending: true` ;
 *  - "peut-etre" n entre jamais dans les attendus (D3) : il forme une
 *    fourchette haute, a part ;
 *  - un groupe dont l invitation est revoquee reste dans la liste mais sort
 *    du taux de reponse : on ne peut pas reprocher a quelqu un de ne pas
 *    repondre a un lien qui ne fonctionne plus.
 */

export type HeadcountRsvpStatus = "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE";
export type HeadcountAge = "ADULT" | "CHILD" | "BABY";

export type HeadcountGuest = {
  ageCategory: HeadcountAge;
  attending: boolean | null;
  isPlusOne: boolean;
  mealOptionId: string | null;
  hasAllergies: boolean;
};

export type HeadcountGroup = {
  maxSeats: number;
  /** null : aucune invitation creee pour ce groupe */
  invitation: {
    state: "CREATED" | "SHARED" | "OPENED" | "RESPONDED" | "REVOKED";
    status: HeadcountRsvpStatus;
    seatsUsed: number;
  } | null;
  guests: HeadcountGuest[];
};

export type Headcount = {
  groups: {
    total: number;
    withInvitation: number;
    shared: number;
    opened: number;
    responded: number;
    pending: number;
    attending: number;
    declined: number;
    maybe: number;
    /** Groupes dont les presents depassent le quota : anomalie a signaler */
    overQuota: number;
  };
  people: {
    listed: number;
    invitedSeats: number;
    expected: number;
    adults: number;
    children: number;
    babies: number;
    plusOnes: number;
    declined: number;
    maybe: number;
    noResponse: number;
    checkedIn: number;
  };
  meals: { byOption: Record<string, number>; unassigned: number; withAllergies: number };
  /** Entre 0 et 1 ; 0 quand aucune invitation active */
  responseRate: number;
  capacity: {
    limit: number | null;
    expected: number;
    /** attendus + peut-etre : ce qu il faut pouvoir absorber au pire */
    upperBound: number;
    remaining: number | null;
    exceeded: boolean;
  };
};

const OPENED_STATES = new Set(["OPENED", "RESPONDED"]);
const SHARED_STATES = new Set(["SHARED", "OPENED", "RESPONDED"]);

export function computeHeadcount(groups: readonly HeadcountGroup[], capacityLimit: number | null = null): Headcount {
  const h: Headcount = {
    groups: { total: 0, withInvitation: 0, shared: 0, opened: 0, responded: 0, pending: 0, attending: 0, declined: 0, maybe: 0, overQuota: 0 },
    people: { listed: 0, invitedSeats: 0, expected: 0, adults: 0, children: 0, babies: 0, plusOnes: 0, declined: 0, maybe: 0, noResponse: 0, checkedIn: 0 },
    meals: { byOption: {}, unassigned: 0, withAllergies: 0 },
    responseRate: 0,
    capacity: { limit: capacityLimit, expected: 0, upperBound: 0, remaining: null, exceeded: false },
  };

  let activeInvitations = 0;
  let activeResponded = 0;

  for (const group of groups) {
    h.groups.total += 1;
    h.people.invitedSeats += group.maxSeats;
    // Les "+1" ajoutes puis retires (attending false) ne sont pas des invites listes.
    const listed = group.guests.filter((g) => !(g.isPlusOne && g.attending === false));
    h.people.listed += listed.length;

    const inv = group.invitation;
    const status: HeadcountRsvpStatus = inv?.status ?? "PENDING";

    if (inv) {
      h.groups.withInvitation += 1;
      h.people.checkedIn += inv.seatsUsed;
      if (SHARED_STATES.has(inv.state)) h.groups.shared += 1;
      if (OPENED_STATES.has(inv.state)) h.groups.opened += 1;
      if (inv.state !== "REVOKED") {
        activeInvitations += 1;
        if (status !== "PENDING") activeResponded += 1;
      }
    }

    switch (status) {
      case "ATTENDING": {
        h.groups.responded += 1;
        h.groups.attending += 1;
        const present = group.guests.filter((g) => g.attending === true);
        if (present.length > group.maxSeats) h.groups.overQuota += 1;
        for (const guest of present) {
          h.people.expected += 1;
          if (guest.ageCategory === "ADULT") h.people.adults += 1;
          else if (guest.ageCategory === "CHILD") h.people.children += 1;
          else h.people.babies += 1;
          if (guest.isPlusOne) h.people.plusOnes += 1;
          if (guest.mealOptionId) {
            h.meals.byOption[guest.mealOptionId] = (h.meals.byOption[guest.mealOptionId] ?? 0) + 1;
          } else if (guest.ageCategory !== "BABY") {
            // Un bebe ne prend pas de repas : il n est pas "sans choix".
            h.meals.unassigned += 1;
          }
          if (guest.hasAllergies) h.meals.withAllergies += 1;
        }
        // Ceux du groupe qui ne viennent pas comptent comme absents.
        h.people.declined += group.guests.filter((g) => g.attending === false && !g.isPlusOne).length;
        // Groupe confirme mais personne non tranchee (ajoutee a la liste apres
        // la reponse, par exemple) : c est une reponse qui manque, pas un absent.
        h.people.noResponse += group.guests.filter((g) => g.attending === null).length;
        break;
      }
      case "DECLINED":
        h.groups.responded += 1;
        h.groups.declined += 1;
        h.people.declined += listed.length;
        break;
      case "MAYBE":
        h.groups.responded += 1;
        h.groups.maybe += 1;
        // Un "peut-etre" porte sur tout le groupe : le detail par personne
        // n a de sens qu une fois la presence confirmee.
        h.people.maybe += listed.length;
        break;
      default:
        h.groups.pending += 1;
        h.people.noResponse += listed.length;
    }
  }

  h.responseRate = activeInvitations === 0 ? 0 : activeResponded / activeInvitations;
  h.capacity.expected = h.people.expected;
  h.capacity.upperBound = h.people.expected + h.people.maybe;
  if (capacityLimit !== null) {
    h.capacity.remaining = capacityLimit - h.people.expected;
    h.capacity.exceeded = h.people.expected > capacityLimit;
  }
  return h;
}
