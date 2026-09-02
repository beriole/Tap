# Modèle de données

Référence : cahier des charges §10, §11. Source de vérité : `prisma/schema.prisma`.

## Vue d'ensemble

```
User ──1:n──> Profile ──1:n──> ProfileLink ──1:n──> ClickEvent
 │              │  1:1
 │              ├──────────> ProfileTheme ──n:1──> Theme
 │              │  1:n
 │              └──────────> NfcCard ──1:n──> ScanEvent
 ├──1:1──> Subscription
 ├──1:n──> Account / Session / VerificationToken
 └──1:n──> AuditLog (acteur)
```

## Entités

| Entité | Rôle | Points d'attention |
|---|---|---|
| `User` | Compte (client, admin, super-admin) | `status: INVITED` couvre l'invitation après achat (§5.1) |
| `Profile` | Contenu public | `fieldVisibility` (JSON) porte la visibilité par champ (§5.2) |
| `ProfileLink` | Lien dynamique | `position` + `isVisible` : un lien masqué reste en base (§11) |
| `NfcCard` | Carte physique | `publicToken` unique et immuable ; `uidHash` jamais l'UID en clair |
| `Theme` | Thème publié | `configSchema` décrit les options acceptées ; pas de HTML (§17) |
| `ProfileTheme` | Choix du client | 1:1 avec `Profile` — changer de thème ne touche pas au contenu |
| `ScanEvent` | Ouverture de carte | `coarseDevice` + domaine de referrer uniquement (§15) |
| `ClickEvent` | Action visiteur | `linkId` en `SetNull` : la stat survit à la suppression du lien |
| `Subscription` | Offre | Préparé pour la phase P2, non utilisé en MVP |
| `AuditLog` | Traçabilité admin | Écrit par `server/audit.ts` sur chaque opération sensible (§12) |
| `AppSetting` | Paramètres globaux | Clé/valeur JSON pour le back-office (§16) |

## Règles métier appliquées dans le schéma

| Règle (§11) | Mécanisme |
|---|---|
| Une carte possède un token public unique | `@unique` sur `publicToken` |
| Une carte ne pointe que vers un profil actif | `assignedProfileId` + statut vérifié à la résolution |
| Le client ne peut pas réaffecter sa carte | Aucune route client n'écrit `NfcCard` ; `/api/admin/*` uniquement |
| Un lien masqué reste enregistré | `isVisible: false`, filtré au mapping public |
| Une carte suspendue ne révèle rien | `resolveCard()` sort avant de charger le profil |
| Le QR et la NFC pointent au même endroit | Les deux dérivent de `cardUrl(publicToken)` |

## Suppressions en cascade

- Supprimer un `User` supprime ses profils, liens, thème, sessions et événements de clic.
- Supprimer un `Profile` **ne supprime pas** les `NfcCard` : elles repassent en `assignedProfileId: null`
  (`onDelete: SetNull`) et restent réutilisables — une carte physique survit à son propriétaire.
- Supprimer un `ProfileLink` conserve ses `ClickEvent` (`linkId` passe à `null`).

## Migrations

```bash
npx prisma migrate dev --name <description>   # développement
npx prisma migrate deploy                     # production
npm run db:seed                               # synchronise la table Theme
```

`DIRECT_URL` sert aux migrations quand `DATABASE_URL` passe par un pooler (PgBouncer, Neon,
Supabase). Sans pooler, les deux valeurs sont identiques.
