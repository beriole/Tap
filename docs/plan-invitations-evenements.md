# Plan d'implémentation — Invitations & Événements

Référence : `Cahier_des_charges_Plateforme_Invitations_Evenements_NFC.pdf` (septembre 2026).
Ce plan remplace l'ordre de travail du §23 : il le suit dans l'esprit, mais corrige ses
incohérences (OCR placé avant le check-in, P0 trop large) et l'ancre dans le code existant.

---

## 0. Objectif et règle du jeu

**Livrer la boucle complète le plus tôt possible** : créer → inviter → répondre → piloter →
accueillir, avec **un seul thème vraiment premium**. Tout le reste (thèmes supplémentaires,
OCR, rappels, WhatsApp Business) vient se brancher sur une boucle qui marche déjà.

Trois principes tiennent l'ensemble :

1. **Une seule source de vérité pour les comptes.** Dashboard, exports, capacité et check-in
   appellent la même fonction de calcul (`computeHeadcount`). C'est ce qui garantit les critères
   « sans double comptage » et « exports = totaux affichés ».
2. **Le thème ne touche jamais au métier.** Un thème reçoit un objet `InvitationView` en lecture
   seule et ne rend que de la mise en page — même contrat que les thèmes NFC actuels
   (`docs/themes.md`).
3. **Chaque phase se termine par un critère vérifiable**, joué par un script d'audit navigateur
   (`scripts/audit-*.mjs`, puppeteer), comme le reste du projet.

---

## État d'avancement

| Phase | État | Vérification locale |
|---|---|---|
| 0 — Fondations | ✅ sauf Sentry (reporté en phase 10) | build de production OK, audit 16 (limitation de débit) |
| 1 — Schéma, permissions, jeu de données | ✅ | `npm test` 16/16 · `npm run audit:invitations` 20/20 |
| 2 — Espace organisateur : événement, contenu, invités | ✅ | `npm test` 31/31 · `npm run audit:invitations` 42/42, deux passages consécutifs |
| 3 — DesignEngine + thème « Royal Ivory » | ✅ | `npm test` 40/40 · `npm run audit:invitations` 54/54, deux passages consécutifs |
| 4 — Lien invité, enveloppe, publication | ✅ | `npm test` 44/44 · `npm run audit:invitations` 71/71, deux passages consécutifs |
| 5 — RSVP multi-étapes | ✅ | `npm test` 59/59 · `npm run audit:invitations` 89/89, deux passages consécutifs |
| 6 — Distribution + import CSV | ✅ | `npm test` 72/72 · `npm run audit:invitations` 103/103, deux passages consécutifs |
| 7 — Dashboard + exports | ✅ | `npm test` 79/79 · `npm run audit:invitations` 113/113, deux passages consécutifs |
| 8 — QR, accueil, audit | ✅ | `npm test` 84/84 · `npm run audit:invitations` 137/137 (fonctionnel) |
| 9 — MVP-b : thèmes, XLSX/PDF, équipe, vitrine | ✅ (Pearl, Romantic, Modern Glass reportés) | `npm test` 84/84 · `npm run audit:invitations` 148/149, trois passages : seul le LCP (voir ci-dessous) |
| 10 — Qualité et lancement | ✅ en local (reste : vérifications sur Vercel, voir ci-dessous) | `npm test` 93/93 · `npm run audit:invitations` 156/156 · `npm run db:backup:verify` |

> **Fin du MVP-a** : la boucle créer → inviter → répondre → piloter → accueillir est complète et testée
> en local. Test grandeur nature recommandé avant la phase 9.

**Phase 10, précisions**

- **Premier rendu de la page invité, résolu.** Trace Chrome (catégories layout + fonts) : sur les 1,34 s
  de première mise en page (processeur ×4), 1 s partait en recherches DirectWrite « par nom unique »
  et en rechargements d'Arial / Times New Roman pour chaque graisse et style (22 chargements). Cause :
  les faces « X Fallback » en `src: local()` que `next/font` ajoute par défaut (`adjustFontFallback`).
  Désactivées partout : mise en page 0,65 s, LCP médian **2,0 s** (était 2,5–2,7 s), CLS 0,005. Sur
  Android ces faces n'avaient aucun effet (pas d'Arial) : rien de perdu là où l'invitation est lue.
- **Sécurité** : toutes les routes `/api/organizer/events/*` passent par `eventRoute(id, permission)`,
  les sous-ressources (groupe, poste, membre) sont filtrées par `eventId` dans la requête même ; jetons
  de 32 octets sur les trois surfaces publiques, format vérifié puis limitation de débit avant toute
  lecture en base ; aucun HTML brut sauf le SVG du QR généré côté serveur ; liens externes construits
  par `encodeURIComponent`. Ajout : le type d'une image téléversée est lu dans ses octets
  (`lib/image-type.ts`), un HTML annoncé `image/png` est refusé (415) — audit 195.
- **Purge quotidienne** (`/api/cron/retention`, `vercel.json` 03:00 UTC, `CRON_SECRET` en Bearer) :
  allergies effacées J+30 après la fin de l'événement, postes d'accueil révoqués J+7, événement
  archivé J+90 (liens et QR cessent de répondre, rien n'est supprimé), jetons de compte échus et
  invitations à date limite passée révoqués. Règles pures dans `lib/events/retention.ts` (tests à la
  date près), application idempotente et journalisée — audit 192–194.
- **Sauvegarde + restauration testée** : `npm run db:backup` (pg_dump format custom, `backups/`
  ignoré par git) ; `npm run db:backup:verify` restaure dans une base jetable `<nom>_restore_check` et
  compare les comptes de 12 tables ; `--restore <fichier>` vise obligatoirement `RESTORE_DATABASE_URL`,
  jamais la base courante. Vérifié en local : 12/12 tables identiques.
- **Sentry sans SDK** : `lib/monitoring.ts` envoie une enveloppe à l'API Sentry avec la clé publique du
  `SENTRY_DSN` (rien ne part sans DSN). Branché sur `onRequestError` (rendu et routes) et sur la limite
  d'erreur globale du navigateur via `/api/monitoring` (5 par minute par adresse). Ni corps de requête,
  ni cookie : une invitation contient des noms et un jeton. Le SDK aurait ajouté ~30 ko à chaque page.
- **Accessibilité** (axe-core, WCAG 2 A/AA, audit 196–198) : 5 thèmes × clair/sombre, page invité
  réelle avec le formulaire, quatre écrans organisateur — zéro violation sérieuse. Corrigé : contrastes
  des pastilles d'état de la console (`--state-*`), du cuivre foncé (`--brand-copper-deep`), de la
  barre latérale, des accents texte d'Editorial (une valeur par variante ; le citron devient moutarde
  sur papier), du bouton Botanical, de l'ocre d'African Luxury (encre sur ocre, pas blanc), du sceau de
  l'enveloppe ; `<dl>` des indicateurs sans enfant illégal. La mesure émule `prefers-reduced-motion` :
  sans cela axe lit les sections en cours d'apparition à 10 % d'opacité.
- **À vérifier sur un déploiement de prévisualisation Vercel** (impossible en local) :
  `<link rel="preload" as="font">` présent (le manifeste de polices est vide sur Windows) ; le cron
  appelle bien `/api/cron/retention` avec `CRON_SECRET` ; `UPSTASH_*`, `SENTRY_DSN`,
  `NEXT_PUBLIC_APP_URL` renseignés.
- Non fait : Pearl, Romantic, Modern Glass (thèmes), passe « suppression » §15.1 formelle (les thèmes
  ont été dessinés avec cette règle ; une relecture à froid reste utile).

**Phase 9, précisions**

- Quatre thèmes de plus, chacun une **composition** : Midnight Gold (carton de gala, double filet d'or,
  sceau, sections en chiffres romains), Botanical (photo en arche, serif douce Fraunces, feuillages en
  SVG, cartes arrondies), Editorial (couverture de magazine, tout à gauche, prénoms en serif géante,
  sections 01 02 03), African Luxury (bandes tissées en dégradés CSS, médaillon, ruban de date).
  Aucune image décorative : les ornements sont du CSS ou du SVG en ligne.
- Socle commun `components/invitations/shared.tsx` : lieux, sections (programme, dress code, menu,
  FAQ, texte), bloc de réponse, salutation, monogramme. Un thème passe ses classes, le socle place les
  données. Royal Ivory a été rebasé dessus — un seul endroit décide quand le formulaire s'affiche.
- Banc d'essai : 99 rendus (4 thèmes × variantes × 4 cas × largeurs) sans débordement ; noms, date et
  bouton visibles sans défiler à 360×740 et 390×844 pour chaque thème. L'arche de Botanical est bornée
  à 22 svh pour cela.
- Réglages : un accent d'un autre thème retombe sur la valeur par défaut du thème choisi (vérifié).
- Import `.xlsx` lu dans le navigateur (`read-excel-file`, chargé à la demande, 5 Mo max) ; `.xls` et
  `.ods` refusés avec la marche à suivre. Exports XLSX (`exceljs`, formules neutralisées) et PDF
  (`pdf-lib`, A4, cases à cocher, Helvetica standard donc pas de police embarquée) : mêmes lignes que
  le CSV, l'audit relit le classeur et retrouve les totaux SQL.
- Équipe (`/equipe`, D5) : invitation par e-mail crée le compte en attente et rend un lien d'activation
  que le propriétaire transmet lui-même (aucun envoi d'e-mail configuré) ; permissions ajustables ;
  `team` jamais accordé à un co-organisateur ; limite de l'offre appliquée côté serveur.
- Vitrine : section « Invitations » sur la page d'accueil (parcours en quatre temps, cinq thèmes).
- **Performance, à traiter en phase 10** : le LCP médian mesuré par l'audit est passé de 2,2–2,6 s à
  2,5–2,7 s sur cette machine. Ce n'est **pas** dû à la phase 9 : la même mesure sur le code d'avant
  la phase 9, rejoué le même jour, donne 2,5–2,7 s aussi. Ce qui a été établi en traçant le navigateur :
  le HTML arrive à 0,7 s, les feuilles de style à 1,6 s, et le premier rendu n'a lieu qu'à 2,4–2,6 s.
  Cet écart de 0,8–1,0 s (processeur ralenti ×4) ne dépend ni du contenu (`body { display: none }`
  le laisse intact), ni des polices (Arial forcé : idem), ni des animations. La page `/login` n'a
  que 0,26 s d'écart, la page d'accueil 0,9 s. À isoler avec une trace `blink.debug.layout` ;
  pistes : les 57 `@font-face` (deux fichiers CSS de polices) et la feuille Tailwind globale (132 ko,
  22 ko compressés) chargée par la page invité. Un import dynamique par thème ne sépare pas les
  `@font-face` (vérifié : Next rassemble le CSS de tout le graphe de la page).
- **Préchargement des polices** : `.next/server/next-font-manifest.json` est vide sur cette machine
  (`app: {}`), y compris pour les polices du layout racine — d'où l'absence de `<link rel="preload">`
  constatée depuis la phase 4. Hypothèse : chemins Windows dans le plugin de manifeste. À vérifier sur
  un déploiement de prévisualisation Vercel (Linux) avant d'y toucher.
- L'audit consomme des groupes « sans réponse » à chaque passage : **relancer le jeu de données avant
  chaque audit**, sinon un passage sur trois échoue faute de groupe disponible (« reading 'guests' »).

**Phase 8, précisions**

- Ticket émis dans la transaction du RSVP : places = présents, mis à jour si la réponse change, annulé
  (jamais supprimé) au déclin. Le code du QR est distinct du jeton d'invitation et stable d'une
  modification à l'autre. Si une famille réduit ses présents après une entrée déjà enregistrée, les
  places ne descendent pas sous les entrées consommées.
- `/t/[code]` : QR en grand (URL de la page, aucune donnée personnelle), groupe et prénoms, état.
  Lien « Voir mon accès » sur l'invitation après confirmation.
- Postes d'accueil (`/accueil/[jeton]`, D6) : PIN à 4 chiffres (ni répétition ni suite), stocké haché,
  montré une seule fois ; opérateur nommé et journalisé ; révocation immédiate ; 8 essais de PIN par
  quart d'heure par adresse et par jeton.
- Poste : scan caméra via `BarcodeDetector` (natif Android/Chrome, iOS 17+), repli saisie/recherche ;
  verdict en grand (vert / orange / rouge) ; entrée totale ou partielle en un geste ; entrée forcée
  signalée et journalisée ; annulation de la dernière entrée.
- **Check-in atomique** : `UPDATE … WHERE seatsUsed + n <= seats` — vérifié par l'audit avec deux
  postes qui font entrer le même groupe en parallèle : une seule entrée, l'autre en conflit.
- Onglet « Accueil » (permission `checkin`) : entrés / restants / groupes entrés / forcées, dernières
  entrées, capacité, gestion des postes.
- Performance : la mesure LCP (médiane de 5 chargements, seuil 2,5 s) oscille entre 2,22 s et 2,59 s
  d'un passage à l'autre **sans changement de code**, selon la charge de la machine qui héberge serveur,
  base et navigateur. Le seuil n'a pas été assoupli ; la piste sérieuse reste le préchargement des polices.

**Phase 7, précisions**

- Bande de titre visible sans défiler à 390 px : attendus, taux de réponse, à relancer, absents, entrées.
  Bloc « À relancer » (pas encore envoyées / sans réponse après envoi) qui mène à l'écran Partage.
- Exports CSV (permission `exports`, journalisés) : tous les invités, traiteur, liste d'accueil. Dérivés des
  **mêmes** groupes que `computeHeadcount` ; la route refuse d'envoyer un fichier dont les totaux ne
  colleraient pas au dashboard. Point-virgule + BOM UTF-8 pour Excel français ; formules neutralisées
  (`=`, `+`, `-`, `@` en tête de cellule). Le texte des allergies n'apparaît qu'avec `sensitive`.
- Rafraîchissement toutes les 10 s, onglet visible seulement : les chiffres clés sont relus en JSON
  (`/headcount`) et posés dans le DOM (`data-figure`), puis `router.refresh()` pour le reste.
  **Constat** : `router.refresh()` seul ne remplaçait pas l'arbre dans certains cas (le flux RSC arrivait
  avec la bonne valeur, l'écran gardait l'ancienne), d'où la lecture JSON directe. Le segment
  `/dashboard/events/[id]` est aussi déclaré `force-dynamic`.
- Liste filtrable (présents, sans réponse, absents, peut-être, allergies, avec un mot), recherche par nom.

**Phase 6, précisions**

- Écran « Partage » (permission `messages`) : le **seul** écran organisateur qui reçoit les jetons. États
  à envoyer / envoyée / ouverte / répondue / révoquée, filtres, recherche.
- WhatsApp assisté : `wa.me/<numéro>?text=…` avec le message et le lien ; l'organisateur confirme
  « Envoyé ? Oui ». Mode « Envoyer à la suite » pour enchaîner sans quitter l'écran. Modèle de message
  personnalisable (`{prenom}`, `{hotes}`, `{titre}`, `{date}`, `{lien}`) ; le lien est ajouté s'il est oublié.
- Lien : marquer envoyé ne fait jamais reculer l'état ; révocation → page neutre immédiate ; régénération →
  nouveau jeton, ancien mort, réponse conservée, compteurs d'ouverture remis à zéro ; journalisé.
- Import CSV lu dans le navigateur (UTF-8 ou Windows-1252, séparateur détecté, guillemets RFC 4180, rôles de
  colonnes devinés et modifiables), puis **mêmes contrôles** que le copier-coller (`annotateEntries`).
  Un fichier `.xlsx` est refusé avec la marche à suivre ; le XLSX natif reste en phase 9.
- Audit : après l'ouverture d'un onglet WhatsApp, l'onglet de la console passe en arrière-plan et Chrome y
  suspend l'affichage des rendus diffusés ; l'audit le ramène au premier plan (`bringToFront`) comme le ferait
  un utilisateur. Ce n'est pas un défaut de l'application. Mesure de performance : médiane de cinq chargements.

**Phase 5, précisions**

- Règles dans une fonction pure (`src/lib/events/rsvp.ts`) : quota, date limite, modification autorisée ou non,
  « peut-être » seulement s'il est activé, personnes limitées au groupe, menus de l'événement, allergies
  seulement avec accord explicite, questions obligatoires (par personne si demandé), types de réponse.
- Enregistrement en une transaction avec verrou optimiste (`version`) : deux envois simultanés → un accepté,
  l'autre en conflit. L'historique ne recopie jamais le texte des allergies (purge J+30 possible).
- Formulaire invité : étapes présentes seulement si utiles, présence qui avance seule, menu commun par défaut
  (menu enfant automatique, aucun repas pour un bébé). Famille de 5 : 6 gestes.
- Écran organisateur « Réponses » : réglages, menus et questions ; les suppressions déjà utilisées sont
  signalées avant enregistrement.
- Non inclus : ticket QR à la confirmation (phase 8), relances et notifications (V1).
- Performance : LCP médian 2,29 s mesuré isolément, 2,42 s pendant l'audit — la marge sous 2,5 s est faible,
  à surveiller à chaque ajout sur la page invité.

**Phase 4, précisions**

- `/i/[jeton]` : page neutre unique pour jeton inconnu, révoqué, expiré ou événement non publié ; 60 résolutions
  par minute par adresse ; en-têtes `private, no-store`, `no-referrer`, `noindex` ; aperçu de partage avec les
  hôtes et la date, jamais le nom de l'invité.
- **Ouvertures comptées par le navigateur**, pas au rendu : les robots d'aperçu (WhatsApp, Facebook, Telegram)
  téléchargent la page à chaque partage et n'exécutent pas de JavaScript. Les membres de l'événement ne sont
  pas comptés. L'état avance (créée/partagée → ouverte) sans jamais reculer.
- Enveloppe : ~2 s, « Passer », jouée à la première visite seulement (`?enveloppe=1` pour la rejouer),
  fondu de 250 ms en mouvement réduit, masquée sans JavaScript.
- Publication / dépublication depuis la vue d'ensemble (permission `design`) ; `publishedAt` conservé.
- **Performance** (4G lente, processeur ×4) : LCP 3,8 s → 2,2–2,4 s en retirant toute animation d'entrée des
  noms, de la date et du bouton (§12.1). Écart à corriger pour **toute l'application** : aucune police n'est
  préchargée (`<link rel="preload">` absent, y compris pour les polices globales) ; elles partent vers 1,5 s.

**Phase 3, précisions**

- Contrat unique `InvitationView` (`src/types/invitation.ts`), construit par une fonction pure
  (`src/lib/events/invitation-view.ts`) : dates déjà formatées dans le fuseau du lieu, sections masquées ou
  invalides écartées, aucune note, aucun numéro, aucun jeton.
- Royal Ivory : Bodoni Moda (axe de taille optique) + Geist déjà chargé ; variantes Ivoire / Nuit ; accents
  champagne, rose poudré, sauge (contraste du texte d'accent ≥ 4,5:1) ; compte à rebours optionnel.
  Signature : le cartouche de date.
- Studio `/dashboard/events/[id]/design` : aperçu réel en iframe (`/preview/invitation/[id]`), 360 / 390 / 430 px,
  réglages essayés sans être enregistrés, photo principale.
- Banc d'essai versionné `/preview/invitation/banc` (cas référence, tout est long, minimal, réponses closes),
  contrairement à `/qa-designs` qui reste local.
- Textes visibles par l'invité correctement accentués ; la console garde sa convention sans accents.
- Le bouton « Répondre » de la section réponse est inactif : le formulaire arrive en phase 5.

**Phase 2, précisions**

- Routes API sous `/api/organizer/events/*` : `/api/events/*` est déjà pris par les statistiques de scan et de clic.
- L'invitation (et son jeton) est créée avec le groupe, dès l'ajout manuel ou l'import.
- Permissions : Contenu = `design`, Invités = `guests`, notes internes = `sensitive`. Un co-organisateur sans
  `sensitive` qui modifie un groupe ne peut pas effacer la note qu'il ne voit pas.
- Import CSV/XLSX : non inclus (phases 6 et 9). Le copier-coller accepte déjà un collage depuis Excel (tabulations).
- Photo de l'événement et galerie : reportées à la phase 3 (design), avec le téléversement.
- Navigation mobile : 4 onglets + « Plus » ; Stats, Aperçu et Sécurité redeviennent accessibles au pouce.

**Écarts assumés par rapport au brouillon ci-dessous**

- **Les comptes partent des personnes, pas de compteurs.** `RsvpResponse` n'a pas de champs
  `adults/children/babies` : chaque personne est une ligne `Guest` avec `attending`. Les totaux ne
  peuvent donc pas diverger de la liste des noms.
- **Jetons stockés en clair** (`Invitation.token`, `Ticket.code`, `CheckInStation.token`) : avec un
  hash, l'organisateur ne pourrait plus recopier un lien pour le partage WhatsApp assisté. 32 octets
  aléatoires + révocation. Seul le PIN du poste d'accueil est haché.
- **`GuestPreference`** (nom du cahier §8.1) remplace `GuestMeal`.
- ~~**Navigation mobile**~~ : corrigé en phase 2 (menu « Plus »).

**Tester en local**

```bash
npx prisma migrate dev                      # applique les migrations
SEED_QA_PASSWORD='QaLocal2026a' npm run db:seed:events   # base locale uniquement
npm test
npm run build && npx next start -p 3100
BASE_URL=http://localhost:3100 npm run audit:invitations -- QaLocal2026a   # relancer le seed avant chaque audit
npm run db:backup:verify                    # sauvegarde + restauration dans une base jetable
```

---

## 1. Décisions à valider (valeurs par défaut retenues)

Le cahier laisse ces points ouverts. Le plan avance avec les choix ci-dessous ; chacun est
réversible tant que la phase 1 (schéma) n'est pas migrée.

| # | Question | Décision par défaut | Pourquoi |
|---|---|---|---|
| D1 | Un lien par personne ou par famille ? | **Un lien par `GuestGroup`** (famille/couple/individu seul = groupe de 1). Les personnes sont nommées dans le groupe. | Correspond à la réalité (« la famille Ngono »), limite le nombre de liens à envoyer, et le quota est naturellement porté par le groupe. |
| D2 | QR par personne ou par groupe ? | **Un `Ticket` par invitation, avec un nombre de places** = personnes confirmées. Entrée totale ou partielle (`CheckIn.quantity`). | Couvre l'entrée partielle exigée au §10 sans multiplier les QR. Un mode « QR par personne » reste possible plus tard (corporate). |
| D3 | Réponse « Peut-être » | **Désactivée par défaut.** Si activée : comptée à part, jamais dans « attendus » ; la capacité affiche une fourchette confirmés → confirmés + peut-être. | Évite le double comptage et les faux totaux traiteur. |
| D4 | Lien transféré à un tiers | Le lien ne donne droit **qu'au quota du groupe** ; le QR n'existe qu'après RSVP ; chaque place ne s'enregistre qu'une fois ; l'organisateur peut **révoquer / régénérer** le lien. | Le transfert ne crée aucune place supplémentaire. |
| D5 | Rôles co-organisateur / accueil | **Rôles par événement** (`EventMember` : OWNER, COORGANIZER + permissions). L'enum global `Role` ne bouge pas. | Un même utilisateur est organisateur d'un mariage et co-organisateur d'un autre. |
| D6 | Le personnel d'accueil a-t-il un compte ? | **Non : lien de poste d'accueil** (`CheckInStation`) avec nom d'opérateur + code PIN, révocable, limité à l'événement. | Au mariage, l'accueil est tenu par des proches ; leur créer un compte est une friction inutile. L'opérateur reste journalisé (§10). |
| D7 | Changement d'heure / de lieu après publication | MVP : bandeau « Mis à jour le … » sur la page + liste des invités à prévenir via partage WhatsApp assisté. Envoi automatique en V1. | Pas d'envoi automatique au MVP (§11). |
| D8 | Marché et langue | **Afrique francophone, Cameroun par défaut** : indicatif pays par défaut `+237` réglable par événement, interface en français, textes prêts pour l'anglais. | Cohérent avec WhatsApp, « African Luxury », SMS. À confirmer. |
| D9 | Offre commerciale | **Limites par événement dans `src/config/event-plans.ts`** (ex. Gratuit ≤ 30 invités / 1 thème ; Premium illimité). Paiement en P2. | Même approche que `src/config/plans.ts` pour les cartes. |
| D10 | Animation | **Motion + CSS uniquement au MVP.** Rive évalué en V1 si un designer produit les `.riv`. | Pas de dépendance à une compétence absente. |
| D11 | « Temps réel » | **Rafraîchissement toutes les 10 s** (dashboard, écran jour J). SSE seulement si la mesure le justifie. | Suffisant pour un mariage ; zéro infrastructure. |
| D12 | Allergies | Case de consentement explicite dans le RSVP, visibles seulement par OWNER et permission `sensitive`, **supprimées 30 jours après l'événement**. | Donnée de santé. |

---

## 2. Ce qu'on réutilise

| Brique existante | Usage événements |
|---|---|
| `src/lib/tokens.ts` → `generateSecureToken()` | Jetons d'invitation (32 octets, base64url) et de poste d'accueil |
| `src/lib/qr.ts`, `components/profile/inline-qr.tsx` | QR du ticket |
| `src/lib/storage.ts` | Photos hero, galerie (dossier `tap/evenements`) |
| `src/server/audit.ts` + `AuditLog` | Quotas modifiés, check-ins forcés, exports, révocations |
| `src/lib/auth.ts`, middleware | Espace organisateur sous `/dashboard/events` (déjà protégé) |
| `src/lib/validations/*` (zod) | Même convention pour `event.ts`, `guest.ts`, `rsvp.ts` |
| `src/lib/cache-tags.ts` | Invalidation de la page invitation après modification |
| `components/themes/registry.ts` | **Modèle** du registre des thèmes d'invitation (pas les composants) |
| `components/dashboard/design-studio.tsx`, `theme-picker.tsx` | Base du sélecteur de thème + variantes |
| `scripts/audit-*.mjs` | Tests de parcours de chaque phase |

**À remplacer dès la phase 0** : `src/lib/rate-limit.ts` (mémoire) — inefficace sur Vercel
multi-instances, alors que le RSVP, la résolution de jeton et le check-in doivent être limités.

---

## 3. Architecture cible

### 3.1 Routes

```
Public (sans compte)
  /i/[token]                     invitation : enveloppe → page événement → RSVP
  /i/[token]/ticket              QR d'accès (après RSVP confirmé)
  /accueil/[stationToken]        poste d'accueil : PIN → scanner / recherche

Organisateur (/dashboard, protégé)
  /dashboard/events                          liste + création
  /dashboard/events/[id]                     vue d'ensemble (chiffres clés)
  /dashboard/events/[id]/contenu             infos, lieux, programme, dress code, menu, FAQ, photos
  /dashboard/events/[id]/design              thème, variante, palette, aperçu réel
  /dashboard/events/[id]/invites             liste, groupes, import, liens
  /dashboard/events/[id]/rsvp                questions, repas, date limite, règles
  /dashboard/events/[id]/partage             envoi assisté WhatsApp / e-mail, suivi
  /dashboard/events/[id]/accueil             postes d'accueil, historique des entrées
  /dashboard/events/[id]/equipe              co-organisateurs
  /dashboard/events/[id]/exports             CSV (MVP-a), XLSX / PDF (MVP-b)
```

### 3.2 Code

```
src/server/events/
  permissions.ts        requireEventAccess(userId, eventId, permission) — appelé partout
  event.service.ts      création, publication, archivage
  guest.service.ts      groupes, personnes, quotas, doublons
  invitation.service.ts jetons, révocation, états (créée/partagée/ouverte/répondue)
  rsvp.service.ts       validation des réponses, quotas, date limite, historique
  headcount.ts          computeHeadcount() — SOURCE UNIQUE des totaux
  access.service.ts     tickets, check-in atomique, postes d'accueil
  import.service.ts     copier-coller, CSV, XLSX → lignes à valider
  export.service.ts     exports, basés sur headcount.ts
src/lib/phone.ts        normalisation (libphonenumber-js), jamais d'invention de chiffres
src/lib/validations/{event,guest,rsvp,import}.ts
src/types/invitation.ts InvitationView — contrat unique des thèmes
src/config/invitation-themes.ts   définitions + tokens par thème
src/config/event-plans.ts         limites par offre
src/components/invitations/
  envelope.tsx          ouverture animée + variante reduced-motion
  event-page.tsx        blocs communs (programme, lieux, menu, FAQ) pilotés par le thème
  rsvp/                 formulaire multi-étapes
  themes/registry.ts    clé → composant (dynamic)
  themes/royal-ivory/   thème de référence
src/components/events/  écrans organisateur (tableaux, import, accueil)
```

### 3.3 Nouvelles dépendances (volontairement peu)

| Paquet | Rôle | Phase |
|---|---|---|
| `@upstash/ratelimit` + `@upstash/redis` | Limitation de débit distribuée | 0 |
| `libphonenumber-js` | Normalisation des numéros | 2 |
| `papaparse` | Lecture CSV | 6 |
| `read-excel-file` | Lecture XLSX (léger) | 9 |
| scanner QR : `BarcodeDetector` natif, repli `@zxing/browser` | Caméra du poste d'accueil | 8 |

---

## 4. Modèle de données (brouillon de la phase 1)

```prisma
enum EventType        { WEDDING BIRTHDAY CORPORATE MEMORIAL OTHER }
enum EventStatus      { DRAFT PUBLISHED CLOSED ARCHIVED }
enum EventMemberRole  { OWNER COORGANIZER }
enum GuestAgeCategory { ADULT CHILD BABY }
enum InvitationState  { CREATED SHARED OPENED RESPONDED REVOKED }
enum RsvpStatus       { PENDING ATTENDING DECLINED MAYBE }
enum RsvpQuestionType { TEXT SINGLE_CHOICE MULTI_CHOICE NUMBER BOOLEAN }

model Event {
  id            String      @id @default(cuid())
  type          EventType
  status        EventStatus @default(DRAFT)
  title         String                       // "Mariage de Beriole & Anna"
  hosts         String                       // "Beriole & Anna"
  startsAt      DateTime
  endsAt        DateTime?
  timezone      String      @default("Africa/Douala")
  capacity      Int?
  defaultCountry String     @default("CM")
  themeKey      String      @default("royal-ivory")
  themeSettings Json        @default("{}")   // variante, palette autorisée — validé par le thème
  rsvpSettings  Json        @default("{}")   // maybe autorisé, date limite, modification autorisée…
  plan          String      @default("free")
  publishedAt   DateTime?
  contentUpdatedAt DateTime?                 // bandeau « mis à jour » (D7)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  members   EventMember[]
  venues    Venue[]
  sections  EventSection[]
  groups    GuestGroup[]
  questions RsvpQuestion[]
  meals     MealOption[]
  stations  CheckInStation[]
}

model EventMember {
  id          String          @id @default(cuid())
  eventId     String
  userId      String
  role        EventMemberRole
  permissions String[]        // "guests", "messages", "checkin", "design", "sensitive", "exports"
  @@unique([eventId, userId])
}

model Venue {
  id String @id @default(cuid())
  eventId String
  label String          // "Cérémonie", "Réception"
  name String
  address String
  landmark String?      // repère textuel (§6.3)
  lat Float?
  lng Float?
  startsAt DateTime?
  position Int @default(0)
}

model EventSection {
  id String @id @default(cuid())
  eventId String
  kind String           // program | dresscode | menu | faq | gallery | custom
  title String?
  data Json             // schéma zod propre à chaque kind
  position Int @default(0)
  isVisible Boolean @default(true)
}

model GuestGroup {
  id String @id @default(cuid())
  eventId String
  name String           // "Famille Ngono"
  maxSeats Int          // quota (D1)
  category String?      // "famille marié", "collègues"
  language String @default("fr")
  internalNote String?  // jamais exposé à l'invité
  tags String[]
  guests Guest[]
  invitation Invitation?
  @@index([eventId])
}

model Guest {
  id String @id @default(cuid())
  groupId String
  firstName String
  lastName String?
  phoneE164 String?     // normalisé ; null si incertain
  phoneRaw String?      // saisie d'origine, pour correction
  email String?
  ageCategory GuestAgeCategory @default(ADULT)
  isPrimary Boolean @default(false)   // contact du groupe
  isPlusOne Boolean @default(false)   // ajouté par l'invité lors du RSVP
  @@index([groupId])
}

model Invitation {
  id String @id @default(cuid())
  groupId String @unique
  tokenHash String @unique      // on stocke le hash, comme l'UID des puces
  state InvitationState @default(CREATED)
  sharedAt DateTime?
  firstOpenedAt DateTime?
  openCount Int @default(0)
  expiresAt DateTime?
  revokedAt DateTime?
  response RsvpResponse?
  ticket Ticket?
}

model RsvpResponse {
  id String @id @default(cuid())
  invitationId String @unique
  status RsvpStatus @default(PENDING)
  adults Int @default(0)
  children Int @default(0)
  babies Int @default(0)
  sensitiveConsentAt DateTime?
  respondedAt DateTime?
  version Int @default(1)       // verrou optimiste
  answers RsvpAnswer[]
  history RsvpHistory[]         // snapshot JSON à chaque modification
}

model RsvpQuestion { id String @id @default(cuid()) eventId String type RsvpQuestionType label String options Json @default("[]") required Boolean @default(false) perGuest Boolean @default(false) sensitive Boolean @default(false) position Int @default(0) }
model RsvpAnswer   { id String @id @default(cuid()) responseId String questionId String guestId String? value Json }
model RsvpHistory  { id String @id @default(cuid()) responseId String snapshot Json createdAt DateTime @default(now()) }
model MealOption   { id String @id @default(cuid()) eventId String label String forChildren Boolean @default(false) position Int @default(0) }
model GuestMeal    { guestId String @id mealOptionId String? allergies String? }   // allergies = sensible (D12)

model Ticket {
  id String @id @default(cuid())
  invitationId String @unique
  codeHash String @unique       // le QR porte un code opaque, jamais de donnée personnelle
  seats Int                     // = personnes confirmées
  seatsUsed Int @default(0)
  cancelledAt DateTime?
  checkIns CheckIn[]
}

model CheckInStation {
  id String @id @default(cuid())
  eventId String
  label String                  // "Entrée principale"
  tokenHash String @unique
  pinHash String
  revokedAt DateTime?
}

model CheckIn {
  id String @id @default(cuid())
  ticketId String
  stationId String?
  operatorName String
  quantity Int
  method String                 // "qr" | "manual"
  override Boolean @default(false)   // entrée forcée au-delà du quota → AuditLog
  createdAt DateTime @default(now())
  @@index([ticketId])
}
```

Hors MVP (déjà prévus dans le schéma cible, ajoutés le moment venu) : `TableAssignment`,
`Message`, `ImportJob`, `MediaAsset` dédié, `Organization`.

**Règle d'atomicité du check-in** : une seule requête
`UPDATE "Ticket" SET "seatsUsed" = "seatsUsed" + n WHERE id = $1 AND "seatsUsed" + n <= seats AND "cancelledAt" IS NULL`
— si 0 ligne modifiée, refus. Deux postes qui scannent le même QR à la même seconde ne peuvent
pas faire entrer deux fois.

---

## 5. Phases

Estimations indicatives pour un développeur assisté par IA, en jours de travail effectifs.

### Phase 0 — Fondations · 1–2 j

- Valider les décisions D1–D12 (section 1).
- Remplacer `src/lib/rate-limit.ts` par Upstash (même signature `rateLimit(key, limit, windowMs)`,
  repli mémoire en développement) ; ajouter `UPSTASH_*` à `src/lib/env.ts`.
- Brancher Sentry (le cahier l'exige en production, rien n'existe aujourd'hui).
- Créer `scripts/audit-invitations.mjs` (squelette puppeteer) + script `audit:invitations`.

**Sortie** : les audits existants passent toujours ; la limite de débit tient entre deux instances.

### Phase 1 — Schéma, permissions, jeu de données · 2–3 j

- Migration Prisma de la section 4.
- `permissions.ts` : `requireEventAccess()` — **toute** lecture/écriture d'événement passe par là.
- Services vides mais typés ; `headcount.ts` complet avec tests unitaires (groupes partiels,
  « peut-être », plus-un, déclin après confirmation).
- Seed réaliste : un mariage de 180 invités / 62 groupes, réponses variées, 3 menus, allergies,
  noms longs, groupes sans téléphone.

**Sortie** : un utilisateur B reçoit 404 sur tout événement de A en changeant l'ID dans l'URL
(critère §22) — testé par script.

### Phase 2 — Espace organisateur : événement, contenu, invités · 4–5 j

- Création guidée en 4 écrans : type & date → lieux → hôtes & photo → thème. Objectif §2.1 :
  publiable en < 15 min depuis le modèle.
- Éditeur de sections (programme, dress code, menu, FAQ, galerie) avec schémas zod par `kind`.
- Invités : ajout manuel rapide (clavier seul, groupe + personnes), **copier-coller**
  `Nom - Téléphone - Groupe` avec écran de validation, normalisation `libphonenumber-js`,
  détection de doublons exacts (téléphone) et probables (nom proche dans le même événement).
- Quotas par groupe, tags, catégories.

**Sortie** : créer un événement complet et 50 invités par copier-coller en moins de 15 min,
mesuré dans l'audit.

### Phase 3 — DesignEngine + thème de référence « Royal Ivory » · 5–6 j

- `InvitationView` : type unique, construit côté serveur, **ne contient que ce que l'invité a le
  droit de voir** (jamais notes internes, jamais les autres groupes).
- Tokens de thème (`config/invitation-themes.ts`) : couleurs, 2 polices max via `next/font`,
  espacements, rayons, ombres, matière, motion. `themeSettings` validé par le schéma du thème →
  personnalisation contrôlée, la grille reste protégée (§12.1).
- Processus §15.1 appliqué à ce thème : moodboard (6–12 références) → wireframe → tokens →
  thème complet sur données réalistes.
- Page `/dashboard/events/[id]/design` : aperçu avec les vraies données, bascule 360/390/430 px.
- Banc d'essai `/qa-designs` étendu : nom court/long, sans photo, programme long, 2 lieux,
  8 menus, 10 questions.

**Sortie** : le thème passe le banc d'essai aux 5 largeurs (360, 375, 390, 393, 430) sans
débordement ; changer de variante ne modifie aucune donnée métier.

### Phase 4 — Lien invité, enveloppe, page événement · 4–5 j

- `/i/[token]` : résolution par hash du jeton, limitée en débit, 404 neutre si révoqué/inconnu.
  Enregistre `firstOpenedAt` / `openCount` sans ralentir le rendu (même approche que
  `perf(scan)` : écriture hors du chemin de rendu).
- Premier affichage : couleur de fond + noms + date, sans attendre les images.
- `envelope.tsx` (Motion) : « Toucher pour ouvrir » → sceau → rabat → carte → fondu dans la
  composition, **≤ 4 s**, bouton « Passer », rejouée seulement à la première visite
  (mémorisé côté serveur par `firstOpenedAt`). `prefers-reduced-motion` → fondu court.
  Aucun son avant interaction.
- Page événement : hero + CTA RSVP visible sans défiler, compte à rebours optionnel, programme,
  lieux (bouton itinéraire ; carte chargée à l'approche du viewport), dress code, menu, galerie
  lazy + lightbox, FAQ. CTA RSVP collant discret.
- Métadonnées de partage (aperçu WhatsApp) sans aucune donnée personnelle.

**Sortie** : LCP < 2,5 s en profil « 4G lente » Lighthouse, CLS < 0,05, accessibilité ≥ 95 ;
galerie et carte absentes du premier rendu.

### Phase 5 — RSVP multi-étapes · 4–5 j

Parcours, avec étapes **conditionnelles** pour tenir l'objectif de 3–6 interactions :

1. Présence (Oui / Non / Peut-être si autorisé) — « Non » → message + fin.
2. Qui vient : personnes du groupe cochées (pré-remplies), enfants/bébés, plus-un dans la limite
   du quota.
3. Repas : **un choix appliqué à tous par défaut**, détail par personne en option ; allergies
   derrière consentement.
4. Questions de l'organisateur (seulement si configurées).
5. Récapitulatif → confirmer → écran de succès + QR si l'événement l'exige.

Règles serveur (`rsvp.service.ts`) : quota jamais dépassable sans règle explicite, date limite
(fermeture ou validation manuelle), modification autorisée ou non, verrou optimiste (`version`),
historique à chaque changement. Brouillon conservé si l'invité quitte la page.
Écran organisateur `/rsvp` : questions, repas, date limite, règles.

**Sortie** : un groupe « 1 personne » répond en 3 interactions, une famille de 5 avec repas
identiques en 6 ; une réponse dépassant le quota est refusée même en appelant l'API directement.

### Phase 6 — Distribution + import CSV · 3 j

- Liste des invitations avec état (créée / partagée / ouverte / répondue).
- **Partage WhatsApp assisté** : message court personnalisé (§6.1) + lien, ouverture de
  `wa.me/<numéro>?text=…`, l'organisateur confirme → état « partagée ». Mode « file » : invité
  suivant en un geste.
- Copier le lien, e-mail simple (`mailto:`) au MVP.
- Import CSV : correspondance des colonnes, prévisualisation, mêmes contrôles que le
  copier-coller, import en une transaction.
- Révocation / régénération d'un lien (AuditLog).

**Sortie** : 180 invitations partagées en file sans quitter l'écran ; import d'un CSV de 500 lignes
avec doublons et numéros incomplets signalés avant validation.

### Phase 7 — Dashboard + exports · 3–4 j

- Vue d'ensemble visible sans défiler : invités, attendus, présents, absents, sans réponse, taux
  de réponse, capacité (alerte de dépassement).
- Composition (adultes/enfants/plus-un), repas par menu, allergies (permission `sensitive`),
  invitations non ouvertes → **liste « à relancer »** actionnable (partage assisté).
- Liste paginée + filtres (statut, tag, catégorie, repas).
- Exports CSV : invités, traiteur (repas + allergies), liste d'accueil — tous calculés par
  `headcount.ts`.
- Rafraîchissement toutes les 10 s (D11).

**Sortie** : sur le jeu de données, chaque total du dashboard est identique à la somme recalculée
dans l'export correspondant (test automatisé).

### Phase 8 — QR, accueil, audit · 4 j

- Émission du `Ticket` à la confirmation (places = personnes confirmées), mise à jour si le RSVP
  change, annulation si déclin.
- `/i/[token]/ticket` : QR en grand, luminosité conseillée, nom du groupe et nombre de places.
- Postes d'accueil : création dans `/accueil`, lien + PIN, révocation.
- `/accueil/[stationToken]` : PIN + nom de l'opérateur → scanner caméra ; résultat en < 1 s :
  **valide / déjà utilisé / annulé / quota atteint**, places restantes, table (plus tard), note
  autorisée. Entrée partielle (« 3 sur 5 »). Recherche manuelle par nom ou téléphone.
- Check-in atomique (section 4), entrée forcée = `override` + AuditLog.
- Écran jour J organisateur : arrivées récentes, refus, capacité restante.

**Sortie** : deux postes scannant le même QR simultanément → une seule entrée enregistrée ;
un QR décodé ne contient aucun nom ni numéro.

> **Fin du MVP-a.** Test grandeur nature recommandé : un vrai petit événement (anniversaire,
> 30–60 invités) avant d'aller plus loin.

### Phase 9 — MVP-b : compléter l'offre mariage · 8–10 j

- 4 thèmes supplémentaires, chacun avec **sa propre composition** (pas une recoloration) :
  Midnight Gold, Botanical, Editorial, African Luxury. Pearl, Romantic et Modern Glass ensuite.
  Chaque thème repasse le banc d'essai de la phase 3.
- Import XLSX, exports XLSX et PDF (liste d'accueil imprimable = plan B si le réseau tombe).
- Co-organisateurs (`/equipe`) avec permissions.
- Limites d'offre (`event-plans.ts`) appliquées côté serveur.
- Vitrine : section « Invitations » sur la page d'accueil.

**Fait** (voir « Phase 9, précisions ») ; Pearl, Romantic et Modern Glass restent à dessiner.

### Phase 10 — Qualité et lancement · 3–4 j

- Lighthouse sur les 5 thèmes, accessibilité (focus, contraste, textes alternatifs).
- Premier rendu de la page invité : isoler l'écart de 0,8–1,0 s entre l'arrivée du CSS et le premier
  rendu (voir phase 9) ; vérifier le préchargement des polices sur Vercel.
- Revue de sécurité : IDOR sur toutes les routes, énumération de jetons, XSS dans les champs
  libres (FAQ, questions), uploads.
- Purge automatique (Vercel Cron, `vercel.json` a déjà `crons: []`) : allergies J+30,
  jetons expirés, événements archivés selon la politique de rétention.
- Sauvegarde + **restauration testée** de la base.
- Passe « suppression » du §15.1 : retirer tout effet qui n'aide ni la compréhension ni l'émotion.

**Sortie** : les 14 critères d'acceptation du §22 cochés, chacun relié à un test ou un audit.

---

## 6. Après le MVP

| Version | Contenu | Prérequis technique |
|---|---|---|
| **V1** | Import photo/OCR avec validation humaine (§8.2) · rappels e-mail/SMS planifiés · tables et placement glisser-déposer · collections Anniversaire, Corporate, Memorial | File de tâches (Inngest ou Upstash QStash) · fournisseur e-mail transactionnel avec webhooks · fournisseur SMS couvrant le Cameroun · `MessagingProvider` abstrait |
| **V2** | WhatsApp Business Platform (modèles approuvés, statuts de livraison) · billetterie et paiement (mobile money) · album collaboratif et remerciements | Compte Meta Business vérifié · agrégateur de paiement local |
| **V3** | Relances automatiques des non-répondants · notification des changements de programme · suggestion de tables par IA · check-in hors ligne (cache signé + synchronisation) | Service worker, signature des tickets |

---

## 7. Correspondance avec les critères d'acceptation (§22)

| Critère | Phase | Preuve |
|---|---|---|
| Créer et publier sans intervention technique | 2, 4 | audit 1–3 (création par l'interface), 84 (publication) |
| Jeton non devinable et révocable | 1, 6 | 32 octets `base64url` en clair (D-écart, voir plus haut) ; audit 86 (limitation), 102, 117–118 (révocation) |
| Réponse sans compte | 5 | audit 90–94 en session anonyme |
| Quota non dépassable | 5 | audit 94 (API directe → 422, rien écrit) |
| Dashboard sans double comptage | 1, 7 | `headcount.test.ts` ; audit 131, 139 (page = SQL) |
| QR sans donnée personnelle | 8 | audit 152 (page QR : ni numéro ni jeton) |
| QR déjà consommé signalé | 8 | audit 164 (deux postes, même seconde), 165 |
| Lisible à 360 et 430 px | 3, 9 | audit 50–51, 61, 107, 172, 180–181 |
| Reduced-motion supprime la séquence | 4 | audit 52, 79 |
| Galerie et carte non bloquantes | 4 | audit 83 (LCP médian 2,0 s en 4G lente) ; carte = lien, jamais d'iframe |
| OCR jamais envoyé sans validation | V1 | pas d'envoi automatique possible depuis un import (audit 123 : rien n'est écrit avant validation) |
| Changement de thème conserve les données | 3 | audit 54 (instantané métier identique), 182 |
| Pas d'accès par modification d'URL | 1 | audit 4, 12, 38–41, 58, 60, 110, 117, 136, 157, 185 |
| Exports = totaux du dashboard | 7 | audit 132, 186 ; route refuse un export dont les totaux divergent |
| Données de santé purgées | 10 | audit 193 (allergies effacées à J+30) |
| Sauvegarde restaurable | 10 | `npm run db:backup:verify` |
| Accessibilité AA | 10 | audit 196–198 (axe-core) |

---

## 8. Risques principaux

| Risque | Effet | Parade |
|---|---|---|
| Glissement de périmètre sur le design (« encore un thème ») | Boucle jamais livrée | Un seul thème jusqu'à la fin de la phase 8 |
| Réseau faible le jour J | File d'attente à l'entrée | Recherche manuelle rapide + export PDF de la liste d'accueil (phase 9) ; hors ligne en V3 |
| Enveloppe lente sur Android d'entrée de gamme | Premier contact raté | Animation en `transform`/`opacity` seulement, test sur appareil réel, bouton « Passer » |
| Numéros mal saisis dans les listes | Liens envoyés au mauvais contact | Normalisation stricte, numéro incertain = `null` + signalement, jamais corrigé en silence |
| Données sensibles (allergies, listes familiales) | Exposition juridique | Consentement, permission dédiée, purge J+30, audit des exports |
| Coûts SMS / WhatsApp en V1–V2 | Marge négative | Partage assisté gratuit par défaut, envois payants liés à l'offre |

---

## 9. Calendrier indicatif

| Bloc | Phases | Durée |
|---|---|---|
| Fondations | 0–1 | ~1 semaine |
| Organisateur + design | 2–3 | ~2 semaines |
| Expérience invité | 4–5 | ~2 semaines |
| Pilotage + accueil | 6–8 | ~2 semaines |
| **MVP-a utilisable** | | **~7 semaines** |
| MVP-b + qualité | 9–10 | ~3 semaines |
| **MVP complet (P0 du cahier)** | | **~10 semaines** |
