import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost, Parisienne } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const parisienne = Parisienne({
  variable: "--font-parisienne",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CYLIA Maison de Beauté — Spa, esthétique & coiffure à Sousse",
  description:
    "Soins, esthétique, coiffure et bien-être dans un seul lieu. Réservez votre moment chez CYLIA Maison de Beauté, Av. 14 Janvier, Sousse.",
  openGraph: {
    title: "CYLIA Maison de Beauté",
    description:
      "Soins, esthétique, coiffure et bien-être dans un seul lieu. Sousse.",
    locale: "fr_TN",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0a09",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${jost.variable} ${parisienne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-noir">{children}</body>
    </html>
  );
}
