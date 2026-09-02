import Image from "next/image";
import { cn, initials } from "@/lib/utils";
import { ProfileName } from "./profile-name";
import type { PublicProfile } from "@/types/profile";

type Family = "sans" | "display" | "grotesk";

/**
 * Le bloc identite.
 *
 * Le nom est la seule chose que le visiteur doit retenir : il est traite au
 * cran typographique le plus fort de la page, et le theme choisit la famille.
 * Poste et entreprise passent en dessous, en gris, sans concurrence.
 */
export function ProfileHeader({
  profile,
  preview,
  avatarSize = 112,
  align = "center",
  rounded = "full",
  family = "sans",
  ringed = false,
  halo = true,
  className,
}: {
  profile: PublicProfile;
  /** Dans un apercu, le nom cesse d etre le h1 de la page. */
  preview?: boolean;
  avatarSize?: number;
  align?: "center" | "start";
  rounded?: "full" | "card";
  family?: Family;
  /** Filet d accent autour du portrait, pour les themes qui cadrent une photo. */
  ringed?: boolean;
  /** Halo respirant derriere le portrait : la seule chose qui bouge en continu. */
  halo?: boolean;
  className?: string;
}) {
  const { identity } = profile;
  const subtitle = [identity.title, identity.company].filter(Boolean).join(" · ");

  const shape = rounded === "full" ? "rounded-full" : "rounded-[1.4rem]";

  return (
    <header
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      <div className={cn("relative shrink-0", ringed && "p-[3px]")}>
        {halo && <span aria-hidden className="halo" />}
        {ringed && (
          <div
            aria-hidden
            className={cn("absolute inset-0", shape)}
            style={{
              background: "linear-gradient(145deg, var(--accent), transparent 58%, var(--accent))",
            }}
          />
        )}

        {identity.avatarUrl ? (
          <Image
            src={identity.avatarUrl}
            alt={identity.displayName}
            width={avatarSize}
            height={avatarSize}
            priority
            sizes={`${avatarSize}px`}
            className={cn("relative object-cover", shape)}
            style={{ width: avatarSize, height: avatarSize }}
          />
        ) : (
          <div
            aria-hidden
            className={cn(
              "relative flex items-center justify-center bg-[var(--accent)] font-medium text-[var(--accent-foreground)]",
              shape,
            )}
            style={{ width: avatarSize, height: avatarSize, fontSize: avatarSize * 0.3 }}
          >
            {initials(identity.displayName)}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <ProfileName
          preview={preview}
          className={cn(
            "text-[length:var(--text-title)] leading-[1.08] tracking-[-0.025em]",
            family === "display" && "font-[family-name:var(--font-display)] font-normal",
            family === "grotesk" && "font-[family-name:var(--font-grotesk)] font-semibold",
            family === "sans" && "font-semibold",
          )}
        >
          {identity.displayName}
        </ProfileName>

        {subtitle && (
          <p className="text-[length:var(--text-caption)] text-[var(--muted)]">{subtitle}</p>
        )}

        {identity.tagline && (
          <p className="pt-0.5 text-[length:var(--text-body)] font-medium text-[var(--accent)]">
            {identity.tagline}
          </p>
        )}
      </div>
    </header>
  );
}
