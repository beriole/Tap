import { Mail, Phone } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import type { QuickAction } from "./model";

/** Icone d une action de contact, commune aux trois moteurs. */
export function ActionIcon({
  kind,
  className,
  strokeWidth = 1.75,
}: {
  kind: QuickAction["kind"];
  className?: string;
  strokeWidth?: number;
}) {
  if (kind === "call") return <Phone aria-hidden className={className} strokeWidth={strokeWidth} />;
  if (kind === "email") return <Mail aria-hidden className={className} strokeWidth={strokeWidth} />;
  return <BrandIcon name="whatsapp" className={className} />;
}
