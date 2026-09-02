# Déploiement

## Le point de non-retour

`NEXT_PUBLIC_APP_URL` est l'URL **gravée dans chaque puce NTAG213**. La changer
après avoir encodé un seul lot invalide toutes les cartes déjà distribuées :
elles pointeront vers un domaine qui ne répond plus.

Fixez le domaine définitif **avant** le premier encodage.

## Hébergement recommandé

### Ce que le produit exige vraiment

Le moment qui compte n'est pas le chargement de la vitrine : c'est le **scan**.
Deux personnes debout, la carte encore en main, dix secondes d'attention. La
page `/c/[token]` doit s'ouvrir vite, depuis n'importe où, avec une base de
données à interroger.

Trois conséquences, dans cet ordre d'importance :

1. **La fonction serveur doit être proche des utilisateurs**, pas seulement le
   CDN. La page lit la base à chaque scan : un CDN mondial ne sert à rien si le
   calcul se fait à l'autre bout de la planète.
2. **La base doit être dans la même région que la fonction.** Un aller-retour
   SQL transatlantique coûte plus cher que tout le reste réuni.
3. **Les images ne doivent jamais transiter par le serveur applicatif.**
   Cloudinary s'en charge.

### La pile retenue

| Couche | Choix | Pourquoi |
|---|---|---|
| Application | **Vercel** | Hébergeur natif de Next.js : streaming, cache de route et revalidation à la demande fonctionnent sans configuration. Aucun conteneur à maintenir |
| Région d'exécution | **`cdg1` (Paris)** | La région Vercel la plus proche de l'Afrique centrale et de l'Ouest. Fixée dans `vercel.json` |
| Base de données | **Neon** ou **Supabase**, région Paris/Francfort | Serverless, se met en veille, et surtout co-localisée avec la fonction |
| Images | **Cloudinary** | Redimensionne, négocie le format et livre depuis son CDN. Le serveur ne voit jamais un octet d'image |
| Domaine | Vercel ou votre registrar | HTTPS et renouvellement automatiques |

Coût réel au démarrage : le palier gratuit de chacun suffit largement pour les
premières centaines de cartes.

### Pourquoi pas les autres

- **Railway / Render** — une seule région, réveil à froid sur les paliers bas,
  et vous gérez le runtime. Correct, mais sans avantage ici.
- **Cloudflare Pages** — excellent réseau, mais Prisma y demande un adaptateur
  et un runtime edge : de la friction pour un gain que Cloudinary apporte déjà.
- **VPS** — le moins cher à l'échelle, mais vous héritez des sauvegardes, des
  certificats, des mises à jour et de la supervision. À reconsidérer le jour où
  la facture Vercel dépasse le coût d'un administrateur système.

### Mise en place

1. Importer le dépôt dans Vercel — le framework est détecté seul.
2. Créer la base (Neon ou Supabase) **en région Paris ou Francfort**. Via un
   pooler, renseigner `DATABASE_URL` (pooler) **et** `DIRECT_URL` (direct).
3. Créer le compte Cloudinary, relever les trois clés dans
   *Settings → API Keys*.
4. Renseigner les variables ci-dessous dans le projet Vercel.
5. Déployer, puis initialiser la base :

```bash
npx prisma migrate deploy
npm run db:seed          # thèmes + compte administrateur
```

**Changez immédiatement le mot de passe administrateur du seed.**

## Variables d'environnement

Le serveur **refuse de démarrer** en production si l'une des trois premières
manque ou est invalide (`src/lib/env.ts`, appelé par `instrumentation.ts`).
Mieux vaut un démarrage interrompu qu'une plateforme servie de travers.

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | oui | PostgreSQL. Via un pooler ? renseigner aussi `DIRECT_URL` |
| `AUTH_SECRET` | oui | 32 caractères minimum — `openssl rand -base64 32`. Le changer déconnecte tout le monde |
| `NEXT_PUBLIC_APP_URL` | oui | URL publique **en HTTPS**. Gravée dans les puces |
| `AUTH_TRUST_HOST` | oui | `true` derrière le proxy de Vercel |
| `CLOUDINARY_CLOUD_NAME` | oui en production | Bascule le stockage sur Cloudinary |
| `CLOUDINARY_API_KEY` / `_SECRET` | avec le précédent | Signature des envois, côté serveur uniquement |
| `UPLOAD_DIR` | non | Repli disque. **Inopérant sur Vercel** : système de fichiers éphémère |
| `RESEND_API_KEY` | non | Sans elle, **aucun e-mail ne part** |
| `SENTRY_DSN` | non | Remontée d'erreurs |

## Stockage des images

Avec `CLOUDINARY_CLOUD_NAME` défini, chaque envoi est **signé côté serveur** —
aucun preset non signé n'est ouvert, personne ne peut déposer dans le compte.
L'image est plafonnée à 1600 px et enregistrée en `q_auto,f_auto`.

À la livraison, `src/lib/image-loader.ts` fabrique l'URL de transformation à la
largeur demandée : le navigateur va chercher l'image **chez Cloudinary**, sans
passer par le serveur applicatif.

Remplacer une photo **supprime l'ancienne**. Sans cela, la bibliothèque
grossirait indéfiniment et des portraits de clients survivraient à leur
remplacement.

Sans Cloudinary, le repli écrit dans `UPLOAD_DIR` et sert par `/api/media/[key]`.
Utile en développement, inutilisable sur un hébergement sans état.

## Sonde de santé

`GET /api/health` interroge réellement PostgreSQL et renvoie `503` si la base
est tombée — un serveur qui répond alors que sa base est morte est pire qu'un
serveur arrêté, car le trafic continue de lui être envoyé.

## Piste d'optimisation non appliquée

La page `/c/[token]` est rendue à la demande car elle enregistre le scan côté
serveur (§15). En déplaçant ce comptage vers une balise client, la page
deviendrait cachable par le CDN et servie **sans toucher la base**, avec
invalidation à chaque modification de profil — `revalidatePath` est déjà en
place.

Le compromis est réel : un bloqueur de scripts ferait alors disparaître des
scans des statistiques. Je ne l'ai pas appliqué sans votre arbitrage.

## Ce qui n'est pas branché

| Fonction | État | Conséquence |
|---|---|---|
| Envoi d'e-mails | **non branché** | Les liens d'invitation et de réinitialisation s'affichent à l'écran de l'administrateur, à transmettre à la main |
| Limitation de débit | **en mémoire** | Correcte sur une instance. Sur Vercel, chaque fonction compte séparément : passer sur Upstash Redis avant d'ouvrir les inscriptions |
| Vérification d'e-mail | page statique | L'activation par lien d'invitation en tient lieu |
| Sentry | non branché | `SENTRY_DSN` est lue, aucun client installé |

## Avant la première carte

- [ ] Domaine HTTPS définitif fixé dans `NEXT_PUBLIC_APP_URL`
- [ ] `AUTH_SECRET` généré, jamais celui de `.env.example`
- [ ] Mot de passe administrateur du seed changé
- [ ] Cloudinary configuré et un envoi testé depuis le tableau de bord
- [ ] Base et fonction dans la **même région**
- [ ] Sauvegardes PostgreSQL programmées **et restauration testée** (§12)
- [ ] Un lot de test encodé, relu, puis scanné sur un iPhone **et** un Android (§14)
- [ ] Ne verrouiller définitivement l'écriture des puces qu'après ce test

## Vérification après déploiement

```bash
BASE_URL=https://votre-domaine node scripts/audit-vitrine.mjs
BASE_URL=https://votre-domaine node scripts/audit-admin.mjs admin@… motdepasse
BASE_URL=https://votre-domaine node scripts/audit-parcours.mjs admin@… motdepasse
```

Le dernier joue le parcours commercial complet et **crée des données de test
dans la base visée**. À ne pas lancer contre une production déjà en service.
