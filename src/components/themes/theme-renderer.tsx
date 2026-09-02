import { THEME_COMPONENTS } from "./registry";
import { MotionProvider } from "@/components/profile/motion-provider";
import { readableTextOn } from "@/lib/utils";
import { FONT_PAIRS } from "@/config/themes";
import type { PublicProfile } from "@/types/profile";

/**
 * Point d entree unique du rendu public. Il applique les tokens du theme
 * (accent, mode, police) puis delegue la mise en page au composant de theme.
 */
export function ThemeRenderer({
  profile,
  preview = false,
}: {
  profile: PublicProfile;
  preview?: boolean;
}) {
  const Theme = THEME_COMPONENTS[profile.theme.key] ?? THEME_COMPONENTS.minimal;
  const pair = FONT_PAIRS.find((f) => f.key === profile.theme.fontPair);

  return (
    <div
      data-mode={profile.theme.mode.toLowerCase()}
      data-theme={profile.theme.key}
      style={
        {
          "--accent": profile.theme.accentColor,
          "--accent-foreground": readableTextOn(profile.theme.accentColor),
          // --glow doit etre pose ici : une propriete personnalisee est
          // substituee la ou elle est declaree, donc un --glow defini sur
          // :root garderait l accent de :root, pas celui du theme.
          "--glow": `color-mix(in srgb, ${profile.theme.accentColor} 45%, transparent)`,
          ...(pair ? { "--theme-heading": pair.heading, "--theme-body": pair.body } : {}),
        } as React.CSSProperties
      }
      className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]"
    >
      <MotionProvider>
        <Theme profile={profile} preview={preview} />
      </MotionProvider>
    </div>
  );
}
