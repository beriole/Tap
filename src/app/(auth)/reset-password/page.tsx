import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-forms";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

/**
 * §5.1 - Definition d un nouveau mot de passe depuis un jeton a usage unique.
 * La meme page sert a l activation d un compte invite apres achat de la carte.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <>
      <h1 className="text-lg font-medium">Nouveau mot de passe</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Choisissez un mot de passe unique d au moins 10 caracteres.
      </p>
      <ResetPasswordForm token={token ?? ""} />
    </>
  );
}
