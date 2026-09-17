import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost, Parisienne, Tajawal } from "next/font/google";
import AgentService from "@/components/AgentService";
import MetaPixel from "@/components/MetaPixel";
import NettoyerAncre from "@/components/NettoyerAncre";
import { FournisseurEdition } from "@/components/edition/ContexteEdition";
import { chargerContenus } from "@/lib/donnees";
import { adminConnecte } from "@/lib/supabase/serveur";
import { supabaseConfigure } from "@/lib/supabase/config";
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

// L'arabe du site. Jost, Cormorant et Parisienne n'ont pas une seule lettre
// arabe : sans elle, « بداية من » tomberait sur la police du téléphone, qui
// n'est la même sur aucun.
const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
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
  // Le panneau s'installe sur l'écran d'accueil du salon : c'est la seule
  // façon, sur iPhone, d'y recevoir les alertes de nouvelles demandes.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "CYLIA",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0a09",
  // Installée, l'application occupe l'écran entier : sans cela, le contenu
  // passe sous l'encoche et sous la barre d'accueil de l'iPhone.
  viewportFit: "cover",

  /*
   * Pas de zoom. Une application ne se pince pas.
   *
   * Safari sur iOS ignore `userScalable` depuis iOS 10, par souci
   * d'accessibilité — mais une fois CYLIA installée sur l'écran d'accueil,
   * le zoom n'y est de toute façon plus proposé, et `touch-action` dans
   * `globals.css` ferme le pincement là où ces deux lignes ne suffisent pas.
   *
   * Le zoom automatique à la mise au point d'un champ, lui, est déjà évité
   * autrement : les champs sont en 16 px (voir `ui/champs.ts`). Le régler par
   * le viewport aurait bloqué le zoom de tout le monde pour un seul écran.
   */
  maximumScale: 1,
  userScalable: false,
};

/**
 * Tout le site se rend à la demande.
 *
 * Cette mise en page lit le contenu éditable et la session : aucune page n'est
 * servie depuis un pré-rendu, la liste des routes le confirmait déjà. Le dire
 * ici plutôt que page par page a un effet concret — Next cesse d'essayer de
 * pré-rendre quoi que ce soit, donc **le build ne parle plus du tout à la
 * base**. Une base en panne ne peut alors plus faire échouer un déploiement,
 * ce qui est exactement ce qui s'est produit le 10 septembre.
 *
 * La vitesse ne vient pas de là : elle vient du cache de `chargerDonnees()`.
 */
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Le contenu part dans le HTML de chaque page : c'est lui qui alimente les
  // blocs `Modifiable`, y compris pour une visiteuse. `estAdmin` ne commande
  // plus rien d'affiché depuis le retrait de la barre flottante ; il reste
  // passé au fournisseur, qui en est la seule porte d'entrée si le mode
  // édition sur site revient un jour.
  const [contenus, admin] = await Promise.all([
    chargerContenus(),
    supabaseConfigure ? adminConnecte() : Promise.resolve(null),
  ]);

  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${jost.variable} ${parisienne.variable} ${tajawal.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-noir">
        <MetaPixel />
        <NettoyerAncre />
        <AgentService />
        <FournisseurEdition estAdmin={admin !== null} contenus={contenus}>
          {children}
        </FournisseurEdition>
      </body>
    </html>
  );
}
