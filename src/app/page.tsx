import Coffrets from "@/components/Coffrets";
import EncartBoutique from "@/components/EncartBoutique";
import Footer from "@/components/Footer";
import Galerie from "@/components/Galerie";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Packs from "@/components/Packs";
import Promotions from "@/components/Promotions";
import Services from "@/components/Services";
import {
  chargerCategories,
  chargerCoffrets,
  chargerContenus,
  chargerGalerie,
  chargerGroupes,
  chargerPacks,
  chargerPhotosAccueil,
  chargerPrestations,
  chargerProduits,
  chargerReglages,
} from "@/lib/donnees";
import { promotionsEnCours } from "@/lib/promotions";
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
  const [
    categories,
    groupes,
    prestations,
    packs,
    coffrets,
    photosAccueil,
    photos,
    produits,
    contenus,
    reglages,
  ] = await Promise.all([
    chargerCategories(),
    chargerGroupes(),
    chargerPrestations(),
    chargerPacks(),
    chargerCoffrets(),
    chargerPhotosAccueil(),
    chargerGalerie(),
    chargerProduits(),
    chargerContenus(),
    chargerReglages(),
  ]);

  // Toutes ces lectures viennent du même appel mis en cache : les dix lignes
  // ci-dessus ne font pas neuf allers-retours. Voir `chargerDonnees()`.
  const offres = promotionsEnCours(prestations);

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero photos={photosAccueil} />
        <Services categories={categories} />
        <Packs packs={packs} devise={reglages.devise} />
        <Promotions offres={offres} groupes={groupes} devise={reglages.devise} />
        {reglages.boutique_active && (
          <>
            <Coffrets coffrets={coffrets} produits={produits} devise={reglages.devise} />
            <EncartBoutique produits={produits} devise={reglages.devise} />
          </>
        )}
        <Galerie photos={photos} />
      </main>
      <Footer site={infosSite(contenus)} />
    </>
  );
}
