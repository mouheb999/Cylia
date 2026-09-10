import EncartBoutique from "@/components/EncartBoutique";
import Feature from "@/components/Feature";
import Footer from "@/components/Footer";
import Galerie from "@/components/Galerie";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import {
  chargerCategories,
  chargerContenus,
  chargerGalerie,
  chargerProduits,
  chargerReglages,
} from "@/lib/donnees";
import { infosSite } from "@/lib/site";

/**
 * Rendu à la demande, toujours.
 *
 * Cette page lit des données qui vivent dans Supabase. Sans cette ligne, Next
 * tente de la pré-rendre pendant le build : une base qui bégaie ce jour-là fait
 * alors échouer le déploiement, alors que le site saurait très bien s'afficher
 * avec son catalogue de repli. Le contenu reste rapide grâce au cache de
 * `chargerDonnees()`, pas grâce au pré-rendu.
 */
export const dynamic = "force-dynamic";

export default async function Page() {
  const [categories, photos, produits, contenus, reglages] = await Promise.all([
    chargerCategories(),
    chargerGalerie(),
    chargerProduits(),
    chargerContenus(),
    chargerReglages(),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Services categories={categories} />
        <Feature />
        {reglages.boutique_active && (
          <EncartBoutique produits={produits} devise={reglages.devise} />
        )}
        <Galerie photos={photos} />
      </main>
      <Footer site={infosSite(contenus)} />
    </>
  );
}
