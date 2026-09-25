import type { Coffret, Produit } from "@/lib/supabase/types";

/**
 * Ce qu'un coffret sait de lui-même, une fois croisé avec le catalogue.
 *
 * Les produits d'un coffret sont des identifiants : un flacon retiré de la
 * boutique depuis la composition du coffret n'est simplement plus dans la
 * liste — c'est aussi ce que fait `creer_commande`, qui l'ignore.
 */

/** Les produits du coffret encore au catalogue, dans l'ordre choisi par le salon. */
export function produitsDuCoffret(coffret: Coffret, produits: Produit[]): Produit[] {
  const parId = new Map(produits.map((p) => [p.id, p]));
  return (coffret.produit_ids ?? [])
    .map((id) => parId.get(id))
    .filter((p): p is Produit => p !== undefined);
}

/**
 * Combien de coffrets on peut encore vendre.
 *
 * Le premier flacon qui manque décide. Un coffret « photo seule », sans
 * produit suivi, n'a pas de limite : c'est au salon de le masquer.
 */
export function stockDuCoffret(coffret: Coffret, produits: Produit[]): number {
  const contenu = produitsDuCoffret(coffret, produits);
  if (contenu.length === 0) return 99;
  return Math.max(0, Math.min(...contenu.map((p) => p.stock)));
}

/**
 * Ce que coûteraient les mêmes flacons achetés un par un — affiché barré
 * quand le coffret est moins cher. `null` sans produit ou sans économie.
 */
export function valeurSepareeDuCoffret(coffret: Coffret, produits: Produit[]): number | null {
  const contenu = produitsDuCoffret(coffret, produits);
  if (contenu.length === 0) return null;
  const total = contenu.reduce((somme, p) => somme + p.prix, 0);
  return total > coffret.prix ? total : null;
}

/** Les photos à montrer : celle du coffret, sinon celles de ses flacons. */
export function visuelsDuCoffret(coffret: Coffret, produits: Produit[]): string[] {
  if (coffret.image_url) return [coffret.image_url];
  return produitsDuCoffret(coffret, produits)
    .map((p) => p.image_url)
    .filter((url): url is string => Boolean(url));
}

/** La fiche du coffret. */
export function cheminCoffret(coffret: Pick<Coffret, "id">): string {
  return `/coffrets/${coffret.id}`;
}
