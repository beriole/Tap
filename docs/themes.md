# Stratégie de thèmes

Référence : cahier des charges §6, §17.

## Principe

Un thème est **un composant React indépendant**, pas une feuille de style. Tous reçoivent le même
`PublicProfile` et n'en changent que la mise en page. Le choix du client modifie donc uniquement
le moteur de rendu — jamais la structure des données.

```
config/themes.ts          définition (nom, direction artistique, cible, accent, variantes)
components/themes/registry.ts   clé → composant, chargé en dynamic()
components/themes/theme-*.tsx   le rendu lui-même
prisma → table Theme      ce qui est réellement proposable au client
```

Les trois doivent rester alignés : un thème présent dans le code mais absent de la base n'est pas
sélectionnable (`/admin/themes` le signale, `npm run db:seed` le synchronise).

## Bibliothèque

| # | Clé | Direction artistique | Cible | MVP |
|---|---|---|---|---|
| 01 | `minimal` | Fond clair, typographie généreuse, photo ronde, boutons fins | Consultants, étudiants, développeurs | ✅ |
| 02 | `executive` | Bleu nuit/noir, accents métalliques, portrait cadré, CTA premium | Dirigeants, managers, avocats | ✅ |
| 03 | `creator` | Couleurs expressives, grande couverture, micro-animations | Créateurs, artistes, influenceurs | ✅ |
| 04 | `tech` | Dark mode, gradients contrôlés, GitHub/portfolio en avant | Développeurs, startups | ✅ |
| 05 | `luxury` | Noir/ivoire, typographie éditoriale, détails dorés sobres | Marques premium, immobilier, mode | |
| 06 | `business` | Logo et entreprise prioritaires, coordonnées immédiates | PME, commerces, commerciaux | |
| 07 | `photo` | Image plein écran, panneau flottant semi-transparent | Photographes, modèles, créatifs | |
| 08 | `compact` | Ultra-rapide, boutons essentiels sans défilement | Universel / connexion lente | |
| 09 | `aurora` | Carte de verre sur un champ de couleur qui dérive lentement | Universel haut de gamme | |
| 10 | `carbone` | Métal brossé, typographie gravée, numéro de carte au dos | Cartes métal, prestige | |
| 11 | `signal` | Bandeau organique, pilules aux couleurs des services, QR dans la page | Commerciaux, formateurs | |
| 12 | `editorial` | Noir et blanc, rail social vertical, coordonnées en tableau | Immobilier, courtage | |
| 13 | `hub` | Couverture, portrait en débord, grille d'applications colorées | Créateurs, community managers | |
| 14 | `onyx` | Noir et or, coordonnées encadrées, barre de contact fixe | Consultants, avocats | |
| 15 | `atelier` | En-tête sombre, feuille blanche remontée, QR logé dedans | Agences, artisans | |

### Briques partagées par ces thèmes

| Composant | Rôle |
|---|---|
| `PillLink` | Pilule aux couleurs du service : pastille d'icône, titre, sous-titre |
| `BrandTileGrid` | Grille de tuiles d'application, façon écran d'accueil |
| `ContactRows` | Coordonnées en `table`, `stacked` ou `boxed`, toujours cliquables |
| `InlineQr` | QR posé dans la page (et non en modale), pour montrer son écran |
| `SocialRail` | Rail vertical de réseaux avec le pseudo dans la tranche |

Les couleurs de marque vivent dans `src/config/brand.ts`. Le sous-titre d'un
lien vient de `ProfileLink.description` ; à défaut, le thème retombe sur
`LINK_SUBTITLES`.

> Les regroupements de liens (`socialLinks`, `tileLinks`, `workLinks`) sont dans
> `src/lib/link-groups.ts`, **sans** directive `"use client"`. Une fonction
> exportée d'un module client ne peut pas être appelée depuis un thème, qui est
> un composant serveur — elle ne peut être que rendue comme composant.

## L'action principale

Tous les thèmes placent `<SaveContactButton>` en pleine largeur, en couleur
d'accent, juste sous l'identité. C'est le seul élément coloré de la page.

La raison tient au moment réel du scan : le visiteur est debout face au
propriétaire de la carte, avec une dizaine de secondes d'attention. Le seul
geste qui compte est d'emporter le contact. Les autres actions (appeler,
écrire, itinéraire, partager) sont secondaires — elles arrivent plus tard,
depuis le carnet d'adresses.

Le bouton pointe vers un vrai `<a href="/api/vcard/[token]">` : c'est ce qui
déclenche la fiche contact native d'iOS et d'Android. Un `fetch()` ne
l'ouvrirait pas.

## Mouvement et accessibilité

L'arrivée de la page est orchestrée par `<Stage>` / `<StageItem>` : la page se
pose une fois, puis son contenu se dépose ligne à ligne.

`prefers-reduced-motion` est traité **uniquement** dans `<MotionProvider>`
(`MotionConfig reducedMotion="user"`) et par la media query de `globals.css`.

> Ne jamais brancher le balisage sur `useReducedMotion()`. Ce hook vaut `false`
> au rendu serveur et peut valoir `true` au client : changer une classe ou
> remplacer un composant motion par une balise simple provoque une divergence
> d'hydratation qui fait échouer le rendu de **toute la page** — précisément
> pour les utilisateurs qu'on cherchait à ménager.

## La règle UX

> Le client personnalise son identité, mais ne doit pas pouvoir casser le design.

Concrètement, la personnalisation est **une énumération fermée**, revalidée serveur
(`lib/validations/theme.ts`) :

- **thème** — parmi ceux actifs en base ;
- **accent** — parmi `ACCENT_PALETTE` (16 couleurs contrastées) ;
- **mode** — clair / sombre / auto ;
- **police** — parmi `FONT_PAIRS` ;
- **style de bouton** — plein / contour / pilule / icône + texte ;
- **ordre des liens** et **visibilité des blocs**.

Le thème impose grille, espacements, tailles minimales et comportements responsives. Le client ne
choisit ni les marges, ni les tailles de police, ni les rayons.

## Ajouter un thème

1. Ajouter l'entrée dans `src/config/themes.ts` et la clé dans `ThemeKey` (`src/types/profile.ts`).
2. Créer `src/components/themes/theme-<clé>.tsx` — signature `({ profile, preview }: ThemeProps)`.
3. L'enregistrer dans `registry.ts` (import dynamique).
4. `npm run db:seed` pour le rendre proposable.

Contraintes à respecter dans le composant :

- lisible dès **360 px** de large (§13) ;
- contraste vérifié — utiliser `var(--accent-foreground)`, calculé par `readableTextOn()` ;
- animations discrètes, neutralisées par `prefers-reduced-motion` ;
- images via `next/image`, `priority` sur la seule image au-dessus de la ligne de flottaison ;
- réutiliser `QuickActions`, `LinkList`, `ProfileHeader` plutôt que de refaire les actions §5.4.
