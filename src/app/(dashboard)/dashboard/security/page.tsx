import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PasswordForm } from "@/components/dashboard/password-form";
import { PageBody, PageHeader, SectionTitle, Surface } from "@/components/app/ui";

export const metadata: Metadata = { title: "Securite" };

/** §7 - Zone client : securite du compte. */
export default async function SecurityPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader eyebrow="Espace client" title="Securite" description={`Compte : ${user.email}`} />
      <PageBody>
        <div className="space-y-4">
          <Surface>
            <SectionTitle>Mot de passe</SectionTitle>
            <p className="text-[0.87rem] leading-relaxed text-[var(--muted)]">
              Changer votre mot de passe deconnecte vos autres appareils.
            </p>
            <PasswordForm />
          </Surface>

          <Surface>
            <SectionTitle>Carte perdue</SectionTitle>
            <p className="text-[0.87rem] leading-relaxed text-[var(--muted)]">
              Signalez la perte a votre administrateur : la carte est suspendue immediatement et
              cesse de donner acces a votre profil. Vos donnees, elles, restent intactes.
            </p>
          </Surface>
        </div>
      </PageBody>
    </>
  );
}
