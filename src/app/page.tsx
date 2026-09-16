import EncartBoutique from "@/components/EncartBoutique";
import Feature from "@/components/Feature";
import Footer from "@/components/Footer";
import Galerie from "@/components/Galerie";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Promotions from "@/components/Promotions";
import Services from "@/components/Services";
import {
  chargerCategories,
  chargerContenus,
  chargerGalerie,
  chargerGroupes,
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
    photosAccueil,
    photos,
    produits,
    contenus,
    reglages,
  ] = await Promise.all([
    chargerCategories(),
    chargerGroupes(),
    chargerPrestations(),
    chargerPhotosAccueil(),
    chargerGalerie(),
    chargerProduits(),
    chargerContenus(),
    chargerReglages(),
  ]);

  // Toutes ces lectures viennent du même appel mis en cache : les huit lignes
  // ci-dessus ne font pas huit allers-retours. Voir `chargerDonnees()`.
  const offres = promotionsEnCours(prestations);

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero photos={photosAccueil} />
        <Services categories={categories} />
        <Feature
          // L'encart mène aux offres quand il y en a — c'est ce qu'il met en
          // avant ; sinon, il reprend le chemin de la réservation.
          href={offres.length > 0 ? "/#promotions" : "/reserver"}
          libelleLien={
            offres.length > 0
              ? "Prenez soin de vous — voir nos promotions"
              : "Prenez soin de vous — réserver un soin"
          }
        />
        <Promotions offres={offres} groupes={groupes} devise={reglages.devise} />
        {reglages.boutique_active && (
          <EncartBoutique produits={produits} devise={reglages.devise} />
        )}
        <Galerie photos={photos} />
      </main>
      <Footer site={infosSite(contenus)} />
    </>
  );
}
