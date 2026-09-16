/**
 * Les remises du salon, lues depuis la prestation.
 *
 * Une offre n'est pas une table à part : c'est un tarif plus bas posé sur la
 * prestation, exactement comme `ancien_prix` sur un produit. Une prestation
 * retirée du catalogue emporte donc son offre avec elle, et personne n'a à
 * penser à faire le ménage.
 *
 * Ces mêmes règles sont écrites une seconde fois en SQL, dans
 * `creer_reservation` — c'est la base qui calcule le total facturé, jamais le
 * navigateur. Toucher à l'une sans l'autre ferait afficher un prix et en
 * écrire un autre : voir `supabase/migrations/0026_promotions_et_photos_accueil.sql`.
 */
import { maintenantSalon } from "@/lib/temps-salon";
import type { Prestation } from "@/lib/supabase/types";

/** Une prestation dont l'offre court aujourd'hui. */
export type PrestationEnPromo = Prestation & { prix: number; prix_promo: number };

/**
 * L'offre court-elle encore ?
 *
 * La date de fin est incluse — une offre annoncée « jusqu'au 30 » vaut encore
 * le 30 — et se juge à l'heure de Sousse, comme tout le reste du site.
 */
export function enPromo(
  prestation: Prestation,
  aujourdhui: string = maintenantSalon().dateCle,
): prestation is PrestationEnPromo {
  if (!prestation.actif) return false;
  if (prestation.prix == null || prestation.prix_promo == null) return false;
  if (prestation.prix_promo >= prestation.prix) return false;
  return prestation.promo_fin == null || prestation.promo_fin >= aujourdhui;
}

/** Ce que la cliente paiera : le tarif remisé s'il court, le prix sinon. */
export function tarifDuJour(
  prestation: Prestation,
  aujourdhui: string = maintenantSalon().dateCle,
): number | null {
  return enPromo(prestation, aujourdhui) ? prestation.prix_promo : prestation.prix;
}

/** « −25 % », arrondi à l'entier : une remise s'annonce ronde. */
export function remisePourcent(prestation: PrestationEnPromo): number {
  return Math.round((1 - prestation.prix_promo / prestation.prix) * 100);
}

/** Les offres en cours, dans l'ordre du catalogue. */
export function promotionsEnCours(
  prestations: Prestation[],
  aujourdhui: string = maintenantSalon().dateCle,
): PrestationEnPromo[] {
  return prestations.filter((p): p is PrestationEnPromo => enPromo(p, aujourdhui));
}
