export const siteConfig = {
  name: "Tap",
  tagline: "Une carte physique. Un profil vivant.",
  description:
    "Cartes de visite numeriques NFC : un scan ouvre un profil premium, modifiable en temps reel, sans reecrire la puce.",
  /** URL canonique : la NFC et le QR Code pointent vers la meme destination (§11). */
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  cardPath: process.env.NEXT_PUBLIC_CARD_PATH ?? "/c",
} as const;

/** URL courte ecrite en NDEF dans la NTAG213 - doit rester tres courte (144 octets, §14). */
export function cardUrl(token: string): string {
  return `${siteConfig.url}${siteConfig.cardPath}/${token}`;
}
