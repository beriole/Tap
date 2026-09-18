import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fraunces, Geist, Geist_Mono } from "next/font/google";
import { siteConfig } from "@/config/site";
import "./globals.css";

/**
 * Quatre roles typographiques, pas quatre decorations :
 *  - sans     : le corps de texte, neutre et sur.
 *  - display  : le nom de la personne, la seule chose qu on doit retenir.
 *  - grotesk  : les themes qui veulent du caractere sans serif.
 *  - mono     : coordonnees, tokens, etiquettes techniques.
 *
 * adjustFontFallback: false, partout (ici, themes de cartes, themes
 * d invitation). Par defaut next/font ajoute une face "X Fallback" en
 * src: local("Arial") ou local("Times New Roman") avec size-adjust. Mesure en
 * phase 10, Chrome sur Windows : chaque local() passe par une recherche
 * DirectWrite par nom unique et recharge le fichier systeme (~1 Mo) pour
 * chaque graisse et style - 22 chargements, 0,7 s de mise en page avant le
 * premier rendu (processeur x4). Sans ces faces : 6 chargements, 0,35 s, et
 * le decalage au swap reste a 0,004. Sur Android, Arial n existe pas : ces
 * faces n avaient jamais d effet la ou l invitation est lue.
 */
const sans = Geist({ subsets: ["latin"], variable: "--app-font-sans", display: "swap", adjustFontFallback: false });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--app-font-mono", display: "swap", adjustFontFallback: false });

// Fraunces porte des axes SOFT et WONK : une serif qui a une main, pas une
// Times de secours. Reservee aux grands titres, jamais au corps de texte.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--app-font-display",
  display: "swap",
  adjustFontFallback: false,
  axes: ["SOFT", "WONK", "opsz"],
});

const grotesk = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--app-font-grotesk",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s - ${siteConfig.name}` },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${mono.variable} ${display.variable} ${grotesk.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
