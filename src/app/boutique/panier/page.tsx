import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PanierClient from "@/components/boutique/PanierClient";
import { chargerContenus, chargerProduits, chargerReglages } from "@/lib/donnees";
import { infosSite } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mon panier — CYLIA Maison de Beauté",
  robots: { index: false },
};

export default async function PagePanier() {
  const [produits, reglages, contenus] = await Promise.all([
    chargerProduits(),
    chargerReglages(),
    chargerContenus(),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        <div className="bg-noir px-5 pb-7 pt-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Commande</p>
          <h1 className="mt-3 font-serif text-3xl font-light text-cream">
            Mon
            <span className="mt-0.5 block font-script text-4xl text-gold">panier</span>
          </h1>
        </div>

        <PanierClient produits={produits} reglages={reglages} />
      </main>
      <Footer site={infosSite(contenus)} />
    </>
  );
}
