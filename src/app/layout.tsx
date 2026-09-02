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
 */
const sans = Geist({ subsets: ["latin"], variable: "--app-font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--app-font-mono", display: "swap" });

// Fraunces porte des axes SOFT et WONK : une serif qui a une main, pas une
// Times de secours. Reservee aux grands titres, jamais au corps de texte.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--app-font-display",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const grotesk = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--app-font-grotesk",
  display: "swap",
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
