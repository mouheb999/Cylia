import type { Categorie, Prestation, Reglages } from "@/lib/supabase/types";

/**
 * Filet de sécurité : ce que le site affiche si la base ne répond pas.
 *
 * Une page d'accueil vide serait pire qu'un catalogue un peu ancien. Ces
 * valeurs sont celles semées dans `supabase/migrations/0006_donnees_initiales.sql` ;
 * dès que la base répond, ce sont ses lignes qui gagnent.
 */
export const REGLAGES_DEFAUT: Reglages = {
  id: 1,
  ouverture_minutes: 10 * 60,
  fermeture_minutes: 20 * 60,
  pas_minutes: 30,
  capacite_simultanee: 3,
  delai_minimum_minutes: 60,
  jours_proposes: 14,
  devise: "DT",
  frais_livraison: 7,
  livraison_gratuite_des: 150,
  reservation_active: true,
  boutique_active: true,
  maj_le: "",
};

export const CATEGORIES_DEFAUT: Categorie[] = [
  { id: "coiffure", nom: "Coiffure", description: "Coupe, couleur, soin & style", ordre: 1, actif: true },
  { id: "esthetique", nom: "Esthétique", description: "Soins visage, épilation, ongles", ordre: 2, actif: true },
  { id: "bien-etre", nom: "Bien-être", description: "Massages, relaxation, équilibre", ordre: 3, actif: true },
];

function prestation(
  id: string,
  nom: string,
  categorie_id: string,
  duree_minutes: number,
  ordre: number,
): Prestation {
  return {
    id,
    nom,
    categorie_id,
    duree_minutes,
    prix: null,
    description: "",
    image_url: null,
    ordre,
    actif: true,
    cree_le: "",
  };
}

export const PRESTATIONS_DEFAUT: Prestation[] = [
  prestation("coupe-brushing", "Coupe & brushing", "coiffure", 60, 1),
  prestation("coloration", "Coloration", "coiffure", 120, 2),
  prestation("balayage", "Balayage & mèches", "coiffure", 150, 3),
  prestation("soin-capillaire", "Soin capillaire Keune", "coiffure", 45, 4),
  prestation("head-spa", "Head Spa", "coiffure", 60, 5),
  prestation("hydrafacial", "Soin visage Hydrafacial", "esthetique", 60, 1),
  prestation("hifu", "HIFU — lifting non chirurgical", "esthetique", 90, 2),
  prestation("epilation", "Épilation", "esthetique", 45, 3),
  prestation("ongles", "Manucure & pose d'ongles", "esthetique", 90, 4),
  prestation("make-up", "Make-up", "esthetique", 60, 5),
  prestation("massage-relaxant", "Massage relaxant (californien)", "bien-etre", 60, 1),
  prestation("pierres-chaudes", "Massage aux pierres chaudes", "bien-etre", 75, 2),
  prestation("huiles-essentielles", "Massage aux huiles essentielles", "bien-etre", 60, 3),
  prestation("drainant", "Massage drainant (drainage lymphatique)", "bien-etre", 60, 4),
  prestation("massage-duo", "Massage en duo", "bien-etre", 60, 5),
];
