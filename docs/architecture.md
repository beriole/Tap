# Architecture logique

Référence : cahier des charges §9, §17.

## Flux de scan

```
Smartphone ──NFC/QR──> https://tap.exemple/c/A7K2M9Q
                              │
                              ▼
                    src/app/(public)/c/[token]/page.tsx
                              │
                              ▼
                    server/card-resolution.ts  ← résout carte → profil actif
                              │
                              ├── carte inconnue      → 404
                              ├── suspendue/perdue    → /card-unavailable (page neutre)
                              ├── non attribuée       → /card-unavailable
                              └── OK → toPublicProfile() → PublicProfile normalisé
                                              │
                                              ▼
                                  components/themes/theme-renderer.tsx
                                              │
                                     ThemeMinimal | ThemeExecutive | …
                                              │
                                     after() → ScanEvent (hors chemin critique)
```

## Le contrat `PublicProfile`

`src/types/profile.ts` définit l'objet unique transmis à **tous** les thèmes.
`toPublicProfile()` dans `server/card-resolution.ts` est le seul point où le schéma Prisma
touche la couche de rendu. Conséquences directes :

- un thème ne fait jamais de requête base ;
- changer de thème ne change jamais la structure des données (§17, §20) ;
- la visibilité par champ (`fieldVisibility`) est appliquée **au mapping**, donc un champ masqué
  n'est jamais sérialisé vers le client — il ne fuit ni dans le HTML, ni dans les props RSC ;
- les liens masqués et les URL invalides sont filtrés avant rendu (§11).

## Couches

| Dossier | Rôle | Règle |
|---|---|---|
| `src/config/` | Registres statiques (thèmes, types de liens, plans) | Aucun accès base, importable partout |
| `src/lib/` | Utilitaires purs + clients (Prisma, auth, vCard, QR) | Pas de logique métier de haut niveau |
| `src/server/` | Services métier | `import "server-only"`, jamais importé par un composant client |
| `src/app/api/` | Frontière HTTP | Valide (zod) → vérifie la propriété → délègue au service |
| `src/components/themes/` | Rendu public | Reçoit `PublicProfile`, ne fetch rien |

## Contrôle d'accès (§12)

Deux niveaux, jamais l'un sans l'autre :

1. **Middleware** (`src/middleware.ts`) — config edge-safe, protège `/dashboard` et `/admin`
   par rôle. Les profils publics `/c/:token` ne traversent jamais l'authentification.
2. **Route** — chaque handler appelle `requireUser()` / `requireAdmin()` **puis** vérifie que la
   ressource appartient bien à l'appelant (`where: { profile: { userId } }`). Le middleware seul
   ne prouve pas la propriété d'une ressource.

## Fraîcheur du contenu

§11 impose que les modifications soient visibles immédiatement. `PUT /api/profile` appelle
`revalidatePath()` sur chaque URL de carte associée au profil. La vCard, elle, est en
`Cache-Control: no-store` : elle est reconstruite à chaque téléchargement.

Le QR (`/api/qr/[token]`) est au contraire mis en cache un jour : il ne dépend que du token et
ne divulgue aucune donnée de profil.

## Performance (§13)

- Chaque thème est chargé en `dynamic()` : un profil ne télécharge que le thème utilisé.
- Le thème `compact` est volontairement sans animation ni couverture (connexions lentes).
- `after()` sort l'écriture du `ScanEvent` du chemin de rendu.
- Les animations Motion sont neutralisées par `prefers-reduced-motion` dans `globals.css`.
