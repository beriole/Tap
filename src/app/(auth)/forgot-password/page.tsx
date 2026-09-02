import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/reset-forms";

export const metadata: Metadata = { title: "Mot de passe oublie" };

/** §5.1 - Reinitialisation du mot de passe. */
export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-lg font-medium">Mot de passe oublie</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Indiquez votre e-mail : un lien de reinitialisation vous sera envoye.
      </p>
      <ForgotPasswordForm />
    </>
  );
}
