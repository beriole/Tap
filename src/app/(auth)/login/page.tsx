import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Connexion" };

/** §5.1 - Connexion par e-mail + mot de passe. */
export default async function LoginPage() {
  // Deja connecte : inutile de redemander des identifiants.
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <>
      <h1 className="font-[family-name:var(--font-grotesk)] text-[1.9rem] font-bold leading-[1.05] tracking-[-0.03em] text-[var(--brand-ink)]">
        Bon retour.
      </h1>
      <p className="mt-2.5 text-[0.95rem] leading-relaxed text-neutral-600">
        Modifiez votre profil, vos liens et votre theme. Les changements sont visibles
        immediatement sur votre carte.
      </p>

      <LoginForm />

      <p className="mt-10 border-t border-neutral-200 pt-6 text-[0.8rem] leading-relaxed text-neutral-500">
        Vous venez de recevoir votre carte ? Votre compte est cree par nos soins : utilisez le
        lien d activation recu par e-mail.
      </p>
    </>
  );
}
