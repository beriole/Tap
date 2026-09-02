# Procédure d'exploitation NFC

Référence : cahier des charges §5.6, §14.

## Contrainte matérielle

Le NTAG213 offre **144 octets** de mémoire utilisateur (NFC Forum Type 2 / ISO 14443-A).
NXP cite explicitement la carte de visite parmi ses cas d'usage.

Une URL de la forme `https://tap.exemple/c/A7K2M9Q` tient très largement dans cette limite,
enregistrement NDEF URI compris (le préfixe `https://` est encodé sur 1 octet par la table
d'abréviations NDEF). C'est la raison d'être du token court : **ne jamais faire grossir l'URL**.

## Format du token

`src/lib/tokens.ts` — 7 caractères sur un alphabet de 31 symboles :

```
ABCDEFGHJKMNPQRSTUVWXYZ23456789
```

Les caractères ambigus `0 O 1 I L` sont exclus : le token est lu à voix haute et saisi à la main
au SAV. Espace de ~2,7 × 10¹⁰ combinaisons, tirées de `crypto.randomInt` : l'énumération simple
est impraticable (§12).

> Un token contenant `0`, `1`, `I`, `L` ou `O` est rejeté par `isValidCardToken()` et renverra un
> 404, même s'il existe en base. Ne jamais fabriquer de token à la main hors de cet alphabet.

## Procédure par carte

1. **Créer le lot** dans l'administration (`/admin/cards` → « Créer un lot »).
2. **Récupérer les URL** générées (zone de texte, une URL par ligne).
3. **Écrire l'URL** en NDEF de type URI dans la NTAG213 — smartphone NFC + application
   d'écriture, ou encodeur USB pour les lots.
4. **Relire la puce** et vérifier l'URL caractère par caractère.
5. **Tester le scan** sur au moins un iPhone et un Android.
6. **Associer la carte au client** (`/admin/cards`, association réservée à l'administrateur — §11).
7. **Ne verrouiller définitivement l'écriture** qu'après validation du processus commercial et de
   la procédure de remplacement.

## Cycle de vie d'une carte

| Statut | Comportement de `/c/[token]` |
|---|---|
| `UNASSIGNED` | Page neutre « carte non associée » |
| `ACTIVE` | Rend le profil, si celui-ci est publié et le compte actif |
| `SUSPENDED` | Page neutre — le profil n'est même pas chargé |
| `LOST` | Page neutre — révocation immédiate (§12) |
| `REPLACED` | Page neutre — `replacedByCardId` trace la carte de remplacement |

Un changement de profil **n'exige jamais** de réécriture de la puce. Un changement de domaine
canonique, si.

## QR Code de secours

`/api/qr/[token]` génère le QR depuis le même token, donc vers la même URL canonique (§11).
Il sert de repli quand le téléphone du visiteur n'a pas le NFC actif.

## Point de non-retour

`NEXT_PUBLIC_APP_URL` détermine l'URL encodée dans les puces. **La changer après production
invalide toutes les cartes déjà encodées.** Fixer le domaine définitif avant le premier lot.
