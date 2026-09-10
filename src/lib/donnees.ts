import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { clientPublic } from "@/lib/supabase/public";
import { DELAI_LECTURE, supabaseConfigure } from "@/lib/supabase/config";
import {
  CATEGORIES_DEFAUT,
  PRESTATIONS_DEFAUT,
  REGLAGES_DEFAUT,
} from "@/lib/catalogue-defaut";
import type { ContenuMap } from "@/lib/contenu";
import type {
  Categorie,
  PhotoGalerie,
  Prestation,
  Produit,
  Reglages,
} from "@/lib/supabase/types";

/** Périodes de fermeture à venir, réduites à leurs bornes. */
export type Fermeture = { debut: string; fin: string };

export type DonneesPubliques = {
  reglages: Reglages;
  categories: Categorie[];
  prestations: Prestation[];
  produits: Produit[];
  galerie: PhotoGalerie[];
  contenus: ContenuMap;
  fermetures: Fermeture[];
};

/** Étiquette de cache : toute écriture d'administration la périme. */
export const TAG_SITE = "site";

const REPLI: DonneesPubliques = {
  reglages: REGLAGES_DEFAUT,
  categories: CATEGORIES_DEFAUT,
  prestations: PRESTATIONS_DEFAUT,
  produits: [],
  galerie: [],
  contenus: {},
  fermetures: [],
};

/**
 * Toutes les données du site public, en un seul aller-retour.
 *
 * Le site lisait six tables par navigation. Chacune était un aller-retour vers
 * Francfort avant que la page puisse s'afficher — c'est ce qui rendait la
 * navigation poussive depuis la Tunisie. `donnees_publiques()` renvoie le tout
 * d'un bloc (~7 ko), et `unstable_cache` le garde côté serveur : une page
 * visitée alors que le cache est chaud ne parle pas du tout à Supabase.
 *
 * Ces données sont identiques pour toutes les visiteuses — rien de personnel
 * n'y transite, le partage du cache est donc sans danger. Les écritures du
 * panneau appellent `updateTag(TAG_SITE)` et la page suivante voit le
 * changement ; le délai d'une heure n'est qu'un filet de sécurité.
 */
const lireDonneesPubliques = unstable_cache(
  async (): Promise<DonneesPubliques> => {
    const { data, error } = await clientPublic()
      .rpc("donnees_publiques")
      .abortSignal(AbortSignal.timeout(DELAI_LECTURE));
    if (error) throw error;

    const brut = data as Partial<DonneesPubliques> | null;
    if (!brut?.reglages) throw new Error("Réponse vide de donnees_publiques()");

    return {
      reglages: brut.reglages,
      // Une base vidée par erreur ne doit pas donner un site vide.
      categories: brut.categories?.length ? brut.categories : CATEGORIES_DEFAUT,
      prestations: brut.prestations?.length ? brut.prestations : PRESTATIONS_DEFAUT,
      produits: brut.produits ?? [],
      galerie: brut.galerie ?? [],
      contenus: brut.contenus ?? {},
      fermetures: brut.fermetures ?? [],
    };
  },
  ["donnees-publiques"],
  { tags: [TAG_SITE], revalidate: 3600 },
);

/**
 * `cache()` par-dessus : une même requête peut demander les données à cinq
 * endroits, elles ne sont désérialisées qu'une fois.
 *
 * Ne jette jamais. Si la base est injoignable, le site s'affiche avec ses
 * valeurs de repli plutôt que de rendre une page d'erreur à une cliente qui
 * voulait un numéro de téléphone.
 */
export const chargerDonnees = cache(async (): Promise<DonneesPubliques> => {
  if (!supabaseConfigure) return REPLI;
  try {
    return await lireDonneesPubliques();
  } catch (erreur) {
    console.error("[cylia] lecture des données publiques impossible :", erreur);
    return REPLI;
  }
});

export async function chargerReglages(): Promise<Reglages> {
  return (await chargerDonnees()).reglages;
}

export async function chargerContenus(): Promise<ContenuMap> {
  return (await chargerDonnees()).contenus;
}

export async function chargerCategories(): Promise<Categorie[]> {
  return (await chargerDonnees()).categories;
}

export async function chargerPrestations(): Promise<Prestation[]> {
  return (await chargerDonnees()).prestations;
}

export async function chargerGalerie(): Promise<PhotoGalerie[]> {
  return (await chargerDonnees()).galerie;
}

export async function chargerProduits(): Promise<Produit[]> {
  return (await chargerDonnees()).produits;
}

export async function chargerProduit(slug: string): Promise<Produit | null> {
  const { produits } = await chargerDonnees();
  return produits.find((p) => p.slug === slug) ?? null;
}
