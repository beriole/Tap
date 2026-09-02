import type { Metadata } from "next";

export const metadata: Metadata = { title: "Verification de l e-mail" };

/** §5.1 - Verification d e-mail recommandee. */
export default function VerifyEmailPage() {
  return (
    <>
      <h1 className="text-lg font-medium">Verifiez votre e-mail</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        Un lien de confirmation vient de vous etre envoye. Ouvrez-le depuis le meme appareil pour
        activer votre compte.
      </p>
    </>
  );
}
