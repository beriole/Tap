"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Check, Copy, Mail, MapPin, Phone, QrCode, Share2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { trackClick } from "./track";
import { BrandIcon } from "./brand-icon";
import type { PublicProfile } from "@/types/profile";

/**
 * §13 - La modale QR embarque Radix Dialog et n est utile qu apres un tap.
 * On la sort du chemin critique du profil public.
 */
const QrDialog = dynamic(() => import("./qr-dialog").then((m) => m.QrDialog));

export type ActionTone = "surface" | "glass" | "ink";

/**
 * Les actions secondaires (§5.4).
 *
 * L enregistrement du contact n est deliberement PAS ici : il a son propre
 * bouton pleine largeur. Ce rang-ci regroupe ce qu on fait ensuite - appeler,
 * ecrire, s y rendre, partager - avec un libelle sous chaque icone, parce
 * qu une icone seule se devine mal en dix secondes.
 */
export function QuickActions({
  profile,
  tone = "surface",
  preview,
  className,
}: {
  profile: PublicProfile;
  tone?: ActionTone;
  preview?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const { contact, location, cardToken, id } = profile;

  const directionsHref =
    location.mapUrl ??
    (location.lat != null && location.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
      : location.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`
        : null);

  async function share() {
    trackClick({ profileId: id, action: "SHARE", preview });
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: profile.identity.displayName, url: profile.canonicalUrl });
        return;
      } catch {
        /* partage annule : on retombe sur la copie du lien */
      }
    }
    await copyLink();
  }

  async function copyLink() {
    trackClick({ profileId: id, action: "COPY_LINK", preview });
    await navigator.clipboard.writeText(profile.canonicalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <nav
        aria-label="Actions rapides"
        // Grille de 4 plutot qu un flex-wrap : la rangee garde la meme
        // composition de 320 a 430 px au lieu de retomber en 3+3+1.
        className={cn("grid grid-cols-4 justify-items-center gap-x-1 gap-y-3", className)}
      >
        {contact.phone && (
          <Action
            tone={tone}
            href={`tel:${contact.phone}`}
            label="Appeler"
            onClick={() => trackClick({ profileId: id, action: "CALL", preview })}
          >
            <Phone className="size-[1.15rem]" />
          </Action>
        )}

        {contact.whatsapp && (
          <Action
            tone={tone}
            href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
            label="WhatsApp"
            external
            onClick={() => trackClick({ profileId: id, action: "WHATSAPP", preview })}
          >
            <BrandIcon name="whatsapp" className="size-[1.15rem]" />
          </Action>
        )}

        {contact.email && (
          <Action
            tone={tone}
            href={`mailto:${contact.email}`}
            label="E-mail"
            onClick={() => trackClick({ profileId: id, action: "EMAIL", preview })}
          >
            <Mail className="size-[1.15rem]" />
          </Action>
        )}

        {directionsHref && (
          <Action
            tone={tone}
            href={directionsHref}
            label="Itineraire"
            external
            onClick={() => trackClick({ profileId: id, action: "DIRECTIONS", preview })}
          >
            <MapPin className="size-[1.15rem]" />
          </Action>
        )}

        <Action tone={tone} label="Partager" onClick={share}>
          <Share2 className="size-[1.15rem]" />
        </Action>

        <Action tone={tone} label={copied ? "Copie" : "Copier"} onClick={copyLink}>
          {copied ? <Check className="size-[1.15rem]" /> : <Copy className="size-[1.15rem]" />}
        </Action>

        <Action
          tone={tone}
          label="QR Code"
          onClick={() => {
            trackClick({ profileId: id, action: "QR", preview });
            setQrOpen(true);
          }}
        >
          <QrCode className="size-[1.15rem]" />
        </Action>
      </nav>

      {/* Monte seulement au premier tap : aucun octet de Radix avant. */}
      {qrOpen && (
        <QrDialog
          open={qrOpen}
          onOpenChange={setQrOpen}
          token={cardToken}
          url={profile.canonicalUrl}
          name={profile.identity.displayName}
        />
      )}
    </>
  );
}

function Action({
  href,
  label,
  external,
  tone,
  onClick,
  children,
}: {
  href?: string;
  label: string;
  external?: boolean;
  tone: ActionTone;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const chip = cn(
    "flex size-12 items-center justify-center rounded-[0.9rem] transition-colors duration-200",
    tone === "surface" &&
      "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)]",
    tone === "glass" && "border border-white/18 bg-white/10 text-white backdrop-blur-md hover:bg-white/18",
    tone === "ink" && "border border-white/12 bg-white/[0.04] text-white hover:bg-white/10",
  );

  const body = (
    <>
      <span className={chip}>{children}</span>
      <span
        className={cn(
          "text-[0.65rem] leading-none tracking-tight",
          tone === "surface" ? "text-[var(--muted)]" : "text-white/55",
        )}
      >
        {label}
      </span>
    </>
  );

  const shell = "flex w-full flex-col items-center gap-1.5";
  const motionProps = { whileTap: { scale: 0.93 } };

  if (!href) {
    return (
      <motion.button type="button" onClick={onClick} className={shell} {...motionProps}>
        {body}
      </motion.button>
    );
  }

  return (
    <motion.a
      href={href}
      onClick={onClick}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={shell}
      {...motionProps}
    >
      {body}
    </motion.a>
  );
}
