"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { trackClick } from "./track";

/**
 * Le QR pose directement dans la page, et non derriere un bouton.
 *
 * Le cas d usage est different de celui de la modale : ici, c est le
 * proprietaire de la carte qui tend SON ecran a quelqu un dont le telephone n a
 * pas le NFC. Le code doit donc etre visible sans manipulation.
 *
 * Il pointe vers la meme URL canonique que la puce (§11) - il est genere a
 * partir du token, jamais d une autre source.
 */
export function InlineQr({
  token,
  profileId,
  caption = "Ce code ouvre toujours la version a jour de la carte.",
  tone = "light",
  preview,
  className,
}: {
  token: string;
  profileId: string;
  caption?: string;
  tone?: "light" | "dark";
  preview?: boolean;
  className?: string;
}) {
  return (
    <figure
      onMouseEnter={() => trackClick({ profileId, action: "QR", preview })}
      className={cn(
        "flex flex-col items-center gap-2 rounded-[1.25rem] p-3",
        tone === "dark" ? "bg-white" : "border border-[var(--border)] bg-white",
        className,
      )}
    >
      <Image
        src={`/api/qr/${token}`}
        alt="QR Code du profil"
        width={512}
        height={512}
        unoptimized
        className="h-auto w-full max-w-[9rem]"
      />
      {caption && (
        <figcaption className="max-w-[11rem] text-center text-[0.6rem] leading-snug text-neutral-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
