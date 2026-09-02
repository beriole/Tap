import { cn } from "@/lib/utils";

/**
 * Le nom du proprietaire de la carte.
 *
 * Sur le profil public c est le titre de la page, donc un h1. Mais le meme
 * rendu sert d apercu dans la vitrine et dans l espace client, ou la page a
 * DEJA son propre h1 : un second titre de niveau 1 y serait une erreur de
 * structure, et un lecteur d ecran annoncerait deux titres principaux.
 *
 * Le niveau suit donc le contexte, sans qu aucun theme ait a s en soucier.
 */
export function ProfileName({
  preview,
  className,
  children,
}: {
  preview?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const Tag = preview ? "p" : "h1";
  return <Tag className={cn(className)}>{children}</Tag>;
}
