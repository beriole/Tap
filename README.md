# Plateforme de cartes de visite numériques NFC

> Une carte physique. Un profil vivant. Une identité professionnelle toujours à jour.

Implémentation du cahier des charges `Cahier_des_charges_Plateforme_Cartes_NFC.pdf` (v1.0).
Chaque puce NTAG213 ne contient **qu'une URL courte et stable** (`https://tap.exemple/c/A7K2M9Q`) ;
tout le contenu du profil vit côté serveur et reste modifiable sans jamais réécrire la carte.

## Stack

| Couche | Choix | Réf. CDC |
|---|---|---|
| Langage | TypeScript | §8 |
| Framework | Next.js 15 (App Router, RSC) + React 19 | §8 |
| Styles | Tailwind CSS v4 (design tokens CSS) | §8 |
| Composants | Radix primitives + shadcn/ui (`components.json` prêt) | §8 |
| Animations | Motion for React | §8 |
| Icônes | Lucide + icônes de marques SVG inline | §8 |
| Base de données | PostgreSQL | §8 |
| ORM | Prisma 6 | §8 |
| Auth | Auth.js (NextAuth v5), credentials + OAuth extensible | §8 |
| QR / vCard | Génération serveur (`qrcode`, RFC 6350) | §5.5, §11 |

## Démarrage

```bash
npm install
cp .env.example .env          # renseigner DATABASE_URL et AUTH_SECRET
npx prisma migrate dev --name init
npm run db:seed               # thèmes + admin + profil de démo (/c/SEEDA23)
npm run dev
```

Le seed crée trois comptes et affiche les mots de passe générés une seule fois :

| Compte | Rôle | Contenu |
|---|---|---|
| `SEED_ADMIN_EMAIL` (défaut `admin@tap.exemple`) | SUPERADMIN | propriétaire de la plateforme, sans profil |
| `manager@tap.exemple` | ADMIN | profil complet + carte `/c/SEEDM47` — sert à montrer les deux espaces avec un seul login |
| `demo@tap.exemple` | CLIENT | profil complet, 12 liens, thème, abonnement, carte `/c/SEEDA23` |

Les mots de passe ne sont **jamais** écrits dans le dépôt. Fixez-les par
`SEED_ADMIN_PASSWORD`, `SEED_STAFF_PASSWORD` et `SEED_DEMO_PASSWORD`, ou laissez
le seed les tirer au hasard et notez ce qu'il affiche. Rejouer le seed ne change
jamais un mot de passe existant.

Le seed crée aussi soixante jours de scans et de clics **fictifs** sur les deux
cartes de démonstration : sans eux, les pages Statistiques et Analytics sont des
cadres vides, impossibles à juger. Poser `SEED_HISTORY=false` dès que la
plateforme sert de vrais clients, pour que les chiffres agrégés restent exacts.

## Structure

```
src/
  app/
    (public)/c/[token]/     Profil public — cœur du produit (§9)
    (public)/card-unavailable/  Page neutre carte suspendue/inconnue (§11)
    (auth)/                 Connexion, mot de passe oublié, vérification e-mail (§5.1)
    (dashboard)/dashboard/  Éditeur profil, liens, thème, aperçu, stats, sécurité (§7)
    (admin)/admin/          Dashboard, clients, cartes, thèmes, analytics, paramètres (§16)
    api/                    vCard, QR, événements, profil, liens, thème, upload, admin
  components/
    themes/                 15 thèmes indépendants + registry + renderer (§6.1, §17)
    profile/                Blocs partagés : header, liens, actions rapides, QR (§5.4)
    dashboard/ admin/       Écrans d'administration et d'édition
  config/                   Registre des thèmes, types de liens, plans, site
  lib/                      Prisma, auth, vCard, QR, tokens, sécurité URL, rate limit
  server/                   Résolution de carte, cartes, stats, audit
prisma/                     Schéma (§10) + seed
docs/                       Architecture, modèle de données, thèmes, procédure NFC
```

## Principes non négociables

1. **L'URL NFC ne change jamais.** Modifier un profil ne touche ni au token ni à la puce (§4, §20).
2. **Un seul objet de données pour tous les thèmes.** Changer de thème ne perd aucune donnée (§17).
3. **Aucun HTML libre stocké.** Uniquement des données structurées et des options validées (§17).
4. **Protocoles dangereux interdits.** Toute URL passe par `lib/url-safety.ts` (§11, §12).
5. **Carte suspendue = page neutre.** Le profil n'est même pas chargé (§11).
6. **Statistiques minimisées.** Ni IP, ni user-agent complet, ni identifiant visiteur (§12, §15).

## État d'avancement (MVP §18)

| Priorité | Fonction | État |
|---|---|---|
| P0 | Auth, profils, cartes NFC, association, profil public | Fait, parcours complet vérifié de bout en bout |
| P0 | Liens dynamiques + ordre + visibilité | Fait (réordonnancement par flèches ; drag & drop à ajouter) |
| P0 | 4 thèmes premium distincts | 15 thèmes livrés |
| P0 | vCard, QR Code, partage | Fait |
| P0 | Responsive mobile, images optimisées | Fait — Cloudinary signé + livraison CDN |
| P1 | Personnalisation couleurs/variantes, aperçu temps réel | Fait |
| P1 | Statistiques scans/clics | Fait |
| P1 | Carte perdue/suspendue/remplacement | Fait (API + modèle) |
| P2 | Abonnements, domaines, équipes, wallet | Modèle `Subscription` préparé |

## Déploiement

**Vercel (région `cdg1`, Paris) + Neon/Supabase même région + Cloudinary.**
Le détail et le raisonnement : **[docs/deploiement.md](docs/deploiement.md)**.

Ce qui compte n'est pas le chargement de la vitrine mais le **scan** : la
fonction serveur doit être proche des utilisateurs, la base dans la même
région, et les images servies par un CDN sans passer par le serveur.

En production, le serveur **refuse de démarrer** si `DATABASE_URL`,
`AUTH_SECRET` ou `NEXT_PUBLIC_APP_URL` manque ou est invalide
(`src/lib/env.ts`). Sonde de santé : `GET /api/health`.

> `NEXT_PUBLIC_APP_URL` est gravée dans chaque puce. La changer après un premier
> encodage invalide toutes les cartes distribuées.

## Vérification automatisée

Quatre audits pilotent un vrai navigateur et exercent les fonctions réelles —
pas seulement le fait que les pages répondent :

```bash
npm run audit:vitrine                             # page d'accueil : liens, structure, responsive
npm run audit:admin    admin@… mdp                # back-office : cartes, clients, journal d'audit
npm run audit:espaces  admin@… mdp client@… mdp   # les deux espaces, écran par écran
npm run audit:parcours admin@… mdp                # parcours commercial de bout en bout
```

`audit:espaces` est en **lecture seule** : il peut donc être lancé contre la
production. Il vérifie que chaque écran des deux espaces *affiche* ce qu'il
annonce — un 200 qui rend un cadre vide reste un échec —, que l'aiguillage
après connexion mène chacun chez lui, et qu'un client ne voit ni n'atteint le
back-office.

`audit:parcours` va de la carte vierge au contact enregistré : création de
carte, compte client, activation, profil, association, scan, vCard, suspension.
**Il écrit dans la base visée** — jamais contre une production en service.

## À brancher avant production

- **E-mails transactionnels** — invitation, vérification, réinitialisation (`RESEND_API_KEY`).
- **Rate limit distribué** — `src/lib/rate-limit.ts` est en mémoire : Redis/Upstash en multi-instance.
- **Sentry** — `SENTRY_DSN` (§8 monitoring).
- **Sauvegardes PostgreSQL** et procédure de restauration (§12).

Voir [docs/architecture.md](docs/architecture.md) et [docs/procedure-nfc.md](docs/procedure-nfc.md).
