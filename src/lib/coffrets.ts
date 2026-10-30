import { pourcentageRemise } from "@/lib/format";
import type { Coffret, Produit } from "@/lib/supabase/types";
import { VISUELS_COFFRETS } from "@/lib/visuels-coffrets";

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
 * quand le coffret est moins cher. `null` sans produit, ou quand la remise
 * n'atteint pas 1 % une fois arrondie : un « −0 % » se lirait comme une panne.
 */
export function valeurSepareeDuCoffret(coffret: Coffret, produits: Produit[]): number | null {
  const contenu = produitsDuCoffret(coffret, produits);
  if (contenu.length === 0) return null;
  // Arrondi au millime : 99 + 18.85 + 99 ne tombe pas juste en virgule
  // flottante, et un coffret au prix exact des flacons (Blonde Savior,
  // 275 = 275) ne doit jamais afficher son propre prix barré.
  const total = Math.round(contenu.reduce((somme, p) => somme + p.prix, 0) * 1000) / 1000;
  return pourcentageRemise(coffret.prix, total) !== null ? total : null;
}

/**
 * Le prix à afficher barré à côté de celui du coffret.
 *
 * L'ancien prix fixé par le salon d'abord ; à défaut, ce que coûteraient les
 * flacons achetés séparément. `null` quand il n'y a rien à barrer — même
 * règle que le badge, pour qu'un prix barré ne paraisse jamais sans lui.
 */
export function prixBarreDuCoffret(coffret: Coffret, produits: Produit[]): number | null {
  if (pourcentageRemise(coffret.prix, coffret.ancien_prix) !== null) {
    return coffret.ancien_prix ?? null;
  }
  return valeurSepareeDuCoffret(coffret, produits);
}

/**
 * Les photos à montrer, de la meilleure à la moins bonne :
 *
 *  1. la photo du coffret, déposée dans le panneau ;
 *  2. sa photo de groupe, assemblée par `scripts/visuels-coffrets.mjs` — tant
 *     qu'elle a été faite avec les flacons que le coffret contient encore ;
 *  3. à défaut, les photos de ses flacons, que `VisuelCoffret` range ensemble.
 */
export function visuelsDuCoffret(coffret: Coffret, produits: Produit[]): string[] {
  if (coffret.image_url) return [coffret.image_url];
  const photos = produitsDuCoffret(coffret, produits)
    .map((p) => p.image_url)
    .filter((url): url is string => Boolean(url));
  const groupe = VISUELS_COFFRETS[coffret.id];
  if (
    groupe &&
    groupe.sources.length === photos.length &&
    groupe.sources.every((url, i) => url === photos[i])
  ) {
    return [groupe.src];
  }
  return photos;
}

/** Vrai pour une photo de groupe assemblée : transparente, à ne jamais recadrer. */
export function estPhotoDeGroupe(url: string): boolean {
  return url.startsWith("/visuels-coffrets/");
}

/**
 * L'ordre de la vitrine : du moins cher au plus cher, les épuisés à la fin —
 * un coffret qu'on ne peut pas commander n'a rien à faire en tête de page.
 *
 * `epingle` (le `?coffret=<id>` d'un lien publicitaire) passe devant tout le
 * reste : la cliente qui a touché la publicité d'un coffret le trouve en
 * premier, sans le chercher.
 */
export function trierCoffrets(
  coffrets: Coffret[],
  produits: Produit[],
  epingle?: string | null,
): Coffret[] {
  const disponible = new Map(coffrets.map((c) => [c.id, stockDuCoffret(c, produits) > 0]));
  const tries = [...coffrets].sort(
    (a, b) =>
      Number(disponible.get(b.id)) - Number(disponible.get(a.id)) ||
      a.prix - b.prix ||
      a.ordre - b.ordre,
  );
  const index = epingle ? tries.findIndex((c) => c.id === epingle) : -1;
  if (index > 0) tries.unshift(...tries.splice(index, 1));
  return tries;
}

/** La fiche du coffret. */
export function cheminCoffret(coffret: Pick<Coffret, "id">): string {
  return `/coffrets/${coffret.id}`;
}
