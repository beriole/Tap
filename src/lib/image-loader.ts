/**
 * Chargeur d images de next/image.
 *
 * Cloudinary sait redimensionner, choisir le format et servir depuis son CDN.
 * Faire repasser ses images par l optimiseur de Next ajouterait un aller-retour
 * serveur et un cout de calcul pour un resultat identique. On construit donc
 * l URL de transformation directement : le navigateur va chercher l image chez
 * Cloudinary, le serveur applicatif n en voit jamais un octet.
 *
 * Contrainte a connaitre : declarer un chargeur personnalise DESACTIVE
 * l optimiseur integre de Next. Il n existe plus de route /_next/image vers
 * laquelle se rabattre - tout ce qui n est pas Cloudinary est donc servi tel
 * quel. C est acceptable ici :
 *   - /demo/*    : visuels de vitrine, deja dimensionnes a la main ;
 *   - /api/qr/*  : SVG vectoriel, un redimensionnement n aurait pas de sens ;
 *   - /api/media : pilote local, repli de developpement uniquement.
 * En production les images des clients passent par Cloudinary, donc optimisees.
 */
type LoaderArgs = { src: string; width: number; quality?: number };

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  if (!src.includes("res.cloudinary.com")) return src;

  const transformation = [
    "c_limit",
    `w_${width}`,
    `q_${quality ?? "auto"}`,
    "f_auto",
    "dpr_auto",
  ].join(",");

  // On remplace la transformation deja presente dans l URL enregistree plutot
  // que d en empiler une seconde.
  return src.replace(
    /\/image\/upload\/(?:[^/]*\/)?v(\d+)\//,
    `/image/upload/${transformation}/v$1/`,
  );
}
