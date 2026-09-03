/**
 * Enveloppe de la vue restreinte.
 *
 * Elle n existe que pour une chose : ouvrir la connexion au CDN d images
 * AVANT que le navigateur ait fini de lire le HTML.
 *
 * Le lien arrive par message : le telephone est sur un reseau mobile. Decouvrir res.cloudinary.com
 * seulement au moment de rencontrer la premiere balise <img> coute une
 * resolution DNS, une poignee de main TCP et une negociation TLS - deux a
 * trois allers-retours, soit plusieurs centaines de millisecondes de portrait
 * absent, exactement pendant les dix secondes ou l on regarde l ecran.
 *
 * `preconnect` fait payer ce cout en parallele du telechargement du document.
 */
export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
      <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      {children}
    </>
  );
}
