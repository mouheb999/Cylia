import type { Produit } from "@/lib/supabase/types";

/**
 * Familles de produits.
 *
 * `categorie` dit dans quel rayon d'institut un produit vit — visage, cheveux,
 * corps. La famille dit ce qu'il **est** : un shampooing, un masque, une
 * coloration. Deux cents flacons tous « cheveux » ne se rangent qu'avec la
 * seconde ; c'est elle qui filtre la vitrine et le panneau.
 *
 * L'ordre de cette liste est celui des filtres, et il suit la routine plutôt
 * que l'alphabet : on lave, on démêle, on soigne, on coiffe.
 */
export const FAMILLES = [
  { id: "shampooing", nom: "Shampooings" },
  { id: "apres-shampooing", nom: "Après-shampooings" },
  { id: "masque", nom: "Masques & traitements" },
  { id: "sans-rincage", nom: "Sans rinçage" },
  { id: "huile-serum", nom: "Huiles & sérums" },
  { id: "coiffage", nom: "Coiffage" },
  { id: "coloration", nom: "Coloration" },
  { id: "barbe", nom: "Barbe & rasage" },
  { id: "accessoire", nom: "Accessoires" },
  { id: "soin", nom: "Autres soins" },
] as const;

export const FAMILLE_DEFAUT = "soin";

export function nomFamille(id: string): string {
  return FAMILLES.find((f) => f.id === id)?.nom ?? "Autres soins";
}

/** Une entrée par famille réellement présente, comptée. Les vides ne s'affichent pas. */
export function famillesPresentes(produits: Produit[]) {
  return FAMILLES.map((f) => ({
    ...f,
    nombre: produits.filter((p) => p.famille === f.id).length,
  })).filter((f) => f.nombre > 0);
}

/** Idem pour les gammes, lues dans les marques : Keune Care, Keune Style… */
export function gammesPresentes(produits: Produit[]) {
  const comptes = new Map<string, number>();
  for (const p of produits) {
    if (p.marque) comptes.set(p.marque, (comptes.get(p.marque) ?? 0) + 1);
  }
  return [...comptes.entries()]
    .map(([nom, nombre]) => ({ nom, nombre }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

export const TRIS = [
  { id: "conseille", nom: "Ordre du catalogue" },
  { id: "prix-croissant", nom: "Prix croissant" },
  { id: "prix-decroissant", nom: "Prix décroissant" },
  { id: "nom", nom: "Nom (A → Z)" },
] as const;

export type Tri = (typeof TRIS)[number]["id"];

const parNom = (a: Produit, b: Produit) => a.nom.localeCompare(b.nom, "fr");

/**
 * Tri d'affichage. Un produit épuisé passe derrière les autres quel que soit le
 * tri demandé : proposer en tête ce qu'on ne peut pas vendre serait une perte
 * de temps pour la cliente.
 */
export function trierProduits(produits: Produit[], tri: Tri): Produit[] {
  const rangs: Record<Tri, (a: Produit, b: Produit) => number> = {
    conseille: (a, b) => a.ordre - b.ordre || parNom(a, b),
    "prix-croissant": (a, b) => a.prix - b.prix || parNom(a, b),
    "prix-decroissant": (a, b) => b.prix - a.prix || parNom(a, b),
    nom: parNom,
  };
  const rang = rangs[tri] ?? rangs.conseille;
  return [...produits].sort(
    (a, b) => Number(a.stock <= 0) - Number(b.stock <= 0) || rang(a, b),
  );
}

/** Filtre commun à la vitrine et au panneau. `null` = « tout ». */
export function filtrerProduits(
  produits: Produit[],
  { famille, gamme, recherche }: { famille?: string | null; gamme?: string | null; recherche?: string },
): Produit[] {
  const terme = recherche?.trim().toLowerCase() ?? "";
  return produits.filter((p) => {
    if (famille && p.famille !== famille) return false;
    if (gamme && p.marque !== gamme) return false;
    if (terme && !`${p.nom} ${p.marque}`.toLowerCase().includes(terme)) return false;
    return true;
  });
}
