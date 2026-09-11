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
 * Dernière réponse réussie de la base, gardée en mémoire.
 *
 * C'est le troisième filet, pas le premier. Quand une entrée de cache existe,
 * `unstable_cache` sert la version périmée pendant que la revalidation échoue
 * en arrière-plan — vérifié en coupant une fausse base : la boutique a continué
 * d'afficher ses produits sans qu'une seule ligne de repli ne soit lue.
 *
 * Ce qu'il couvre, c'est l'autre cas : une instance fraîche, ou un cache vidé,
 * pendant que la base est encore muette. Là, `unstable_cache` n'a rien à
 * servir. Plutôt que de retomber sur le catalogue écrit en dur — boutique vide,
 * prix disparus — on ressert la dernière réponse valable que cette instance a
 * vue. Mémoire d'instance : un démarrage à froid la perd, et le catalogue écrit
 * en dur reprend alors la main.
 */
let derniereBonne: DonneesPubliques | null = null;

/**
 * `cache()` par-dessus : une même requête peut demander les données à cinq
 * endroits, elles ne sont désérialisées qu'une fois.
 *
 * Ne jette jamais. Une cliente venue chercher un numéro de téléphone ne doit
 * pas tomber sur une page d'erreur parce que la base fait la sourde oreille.
 */
export const chargerDonnees = cache(async (): Promise<DonneesPubliques> => {
  if (!supabaseConfigure) return REPLI;
  try {
    derniereBonne = await lireDonneesPubliques();
    return derniereBonne;
  } catch (erreur) {
    console.error(
      "[cylia] lecture des données publiques impossible :",
      erreur instanceof Error ? erreur.message : erreur,
    );
    return derniereBonne ?? REPLI;
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
