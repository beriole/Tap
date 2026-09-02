import {
  LinkList,
  ProfileFooter,
  ProfileHeader,
  QuickActions,
  SaveContactButton,
} from "@/components/profile";
import type { ThemeProps } from "@/types/profile";

/**
 * 08 - Compact
 * Profil ultra-rapide : le nom, le bouton de contact et les liens essentiels
 * tiennent sans defilement. Cible : usage universel, connexion lente.
 *
 * Ce theme est le seul a ne PAS utiliser <Stage> : aucune animation d arrivee,
 * aucun fond anime, rien qui retarde le premier rendu. C est sa raison d etre,
 * pas un oubli.
 */
export function ThemeCompact({ profile, preview }: ThemeProps) {
  const { identity, links, id, cardToken } = profile;

  return (
    <main className="profile-shell pt-8">
      <ProfileHeader preview={preview} profile={profile} avatarSize={72} align="start" />

      <div className="mt-5">
        <SaveContactButton
          token={cardToken}
          profileId={id}
          name={identity.displayName}
          preview={preview}
          label="Enregistrer le contact"
        />
      </div>

      <QuickActions profile={profile} preview={preview} className="mt-5" />

      <div className="mt-5">
        <LinkList links={links} profileId={id} variant="outline" preview={preview} />
      </div>

      <ProfileFooter compact />
    </main>
  );
}
