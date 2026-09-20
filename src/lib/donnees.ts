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
import { slugDuPack } from "@/lib/packs";
import type {
  Categorie,
  EmplacementPhoto,
  Groupe,
  Pack,
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
  groupes: Groupe[];
  prestations: Prestation[];
  produits: Produit[];
  packs: Pack[];
  galerie: PhotoGalerie[];
  contenus: ContenuMap;
  fermetures: Fermeture[];
};

/** Étiquette de cache : toute écriture d'administration la périme. */
export const TAG_SITE = "site";

/**
 * Millésime du cache du catalogue.
 *
 * À incrémenter en même temps qu'une modification du catalogue faite hors du
 * panneau — voir la clé de `lireDonneesPubliques` plus bas.
 */
const MILLESIME = "12";

const REPLI: DonneesPubliques = {
  reglages: REGLAGES_DEFAUT,
  categories: CATEGORIES_DEFAUT,
  groupes: [],
  prestations: PRESTATIONS_DEFAUT,
  produits: [],
  packs: [],
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
      groupes: brut.groupes ?? [],
      prestations: brut.prestations?.length ? brut.prestations : PRESTATIONS_DEFAUT,
      produits: brut.produits ?? [],
      packs: brut.packs ?? [],
      galerie: brut.galerie ?? [],
      contenus: brut.contenus ?? {},
      fermetures: brut.fermetures ?? [],
    };
  },
  // Le millésime fait partie de la clé du cache : l'incrémenter abandonne
  // l'entrée précédente, et la première visite après le déploiement relit la
  // base. C'est la sortie de secours quand le catalogue a été modifié
  // ailleurs que dans le panneau — une migration jouée à la main, une
  // correction depuis Supabase : là, personne n'a appelé `updateTag`, et le
  // site resservirait l'ancien catalogue jusqu'à une heure durant.
  ["donnees-publiques", MILLESIME],
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

/**
 * Les photos d'un emplacement, dans l'ordre choisi par le salon.
 *
 * La table `galerie` porte les deux : les photos du bandeau d'accueil et
 * celles de la galerie. Le `??` n'est pas une coquetterie — une base où la
 * migration 0026 n'est pas encore passée renvoie des lignes sans
 * `emplacement`, et elles doivent rester dans la galerie, là où elles étaient.
 */
export async function chargerPhotos(
  emplacement: EmplacementPhoto = "galerie",
): Promise<PhotoGalerie[]> {
  const { galerie } = await chargerDonnees();
  return galerie.filter((photo) => (photo.emplacement ?? "galerie") === emplacement);
}

export async function chargerGalerie(): Promise<PhotoGalerie[]> {
  return chargerPhotos("galerie");
}

/** Les photos qui se relaient dans le bandeau de l'accueil. */
export async function chargerPhotosAccueil(): Promise<PhotoGalerie[]> {
  return chargerPhotos("accueil");
}

export async function chargerGroupes(): Promise<Groupe[]> {
  return (await chargerDonnees()).groupes;
}

/** Les packs de l'accueil, dans l'ordre choisi par le salon. */
export async function chargerPacks(): Promise<Pack[]> {
  return (await chargerDonnees()).packs;
}

/**
 * Un pack par son adresse.
 *
 * `slugDuPack` plutôt que `pack.slug` : une base où la migration 0029 n'est
 * pas encore passée renvoie des lignes sans slug, et la fiche doit quand même
 * s'ouvrir — l'adresse est alors dérivée du nom, des deux côtés. L'identifiant
 * reste accepté, pour les liens forgés avant que les slugs existent.
 */
export async function chargerPack(slug: string): Promise<Pack | null> {
  const { packs } = await chargerDonnees();
  return packs.find((p) => slugDuPack(p) === slug) ?? packs.find((p) => p.id === slug) ?? null;
}

export async function chargerProduits(): Promise<Produit[]> {
  return (await chargerDonnees()).produits;
}

export async function chargerProduit(slug: string): Promise<Produit | null> {
  const { produits } = await chargerDonnees();
  return produits.find((p) => p.slug === slug) ?? null;
}
