import "server-only";
import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { clientServeur } from "@/lib/supabase/serveur";
import { supabaseConfigure } from "@/lib/supabase/config";
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

/**
 * Lectures publiques du site.
 *
 * Deux principes tenus partout ici :
 *
 * - `cache()` — une même page peut demander les prestations à trois endroits,
 *   la base n'est interrogée qu'une fois par requête ;
 * - aucune de ces fonctions ne jette. Si la base est injoignable, le site
 *   s'affiche avec les valeurs de repli plutôt que de rendre une page d'erreur
 *   à une cliente qui voulait juste un numéro de téléphone.
 */
async function sansErreur<T>(travail: () => Promise<T>, repli: T, quoi: string): Promise<T> {
  if (!supabaseConfigure) return repli;
  try {
    return await travail();
  } catch (erreur) {
    // `cookies()` lève une exception de contrôle pour signaler à Next que la
    // page doit être rendue à la demande. L'avaler ici transformerait un site
    // dynamique en site figé sur les valeurs de repli.
    unstable_rethrow(erreur);
    console.error(`[cylia] lecture « ${quoi} » impossible :`, erreur);
    return repli;
  }
}

export const chargerReglages = cache(async (): Promise<Reglages> =>
  sansErreur(
    async () => {
      const supabase = await clientServeur();
      const { data, error } = await supabase.from("reglages").select("*").eq("id", 1).single();
      if (error) throw error;
      return data as Reglages;
    },
    REGLAGES_DEFAUT,
    "réglages",
  ),
);

export const chargerContenus = cache(async (): Promise<ContenuMap> =>
  sansErreur(
    async () => {
      const supabase = await clientServeur();
      const { data, error } = await supabase.from("contenus").select("cle, valeur");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((c) => [c.cle, c.valeur]));
    },
    {},
    "contenus",
  ),
);

export const chargerCategories = cache(async (): Promise<Categorie[]> =>
  sansErreur(
    async () => {
      const supabase = await clientServeur();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("actif", true)
        .order("ordre");
      if (error) throw error;
      return data.length > 0 ? (data as Categorie[]) : CATEGORIES_DEFAUT;
    },
    CATEGORIES_DEFAUT,
    "catégories",
  ),
);

export const chargerPrestations = cache(async (): Promise<Prestation[]> =>
  sansErreur(
    async () => {
      const supabase = await clientServeur();
      const { data, error } = await supabase
        .from("prestations")
        .select("*")
        .eq("actif", true)
        .order("ordre");
      if (error) throw error;
      return data.length > 0 ? (data as Prestation[]) : PRESTATIONS_DEFAUT;
    },
    PRESTATIONS_DEFAUT,
    "prestations",
  ),
);

export const chargerGalerie = cache(async (): Promise<PhotoGalerie[]> =>
  sansErreur(
    async () => {
      const supabase = await clientServeur();
      const { data, error } = await supabase
        .from("galerie")
        .select("*")
        .eq("actif", true)
        .order("ordre");
      if (error) throw error;
      return data as PhotoGalerie[];
    },
    [],
    "galerie",
  ),
);

export const chargerProduits = cache(async (): Promise<Produit[]> =>
  sansErreur(
    async () => {
      const supabase = await clientServeur();
      const { data, error } = await supabase
        .from("produits")
        .select("*")
        .eq("actif", true)
        .order("ordre");
      if (error) throw error;
      return data as Produit[];
    },
    [],
    "produits",
  ),
);

export async function chargerProduit(slug: string): Promise<Produit | null> {
  const produits = await chargerProduits();
  return produits.find((p) => p.slug === slug) ?? null;
}
