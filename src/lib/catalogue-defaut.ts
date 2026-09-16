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
  description = "",
): Prestation {
  return {
    id,
    nom,
    categorie_id,
    groupe_id: null,
    duree_minutes,
    prix: null,
    prix_promo: null,
    promo_libelle: "",
    promo_fin: null,
    description,
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
  prestation("hydrafacial", "Soin visage Hydrafacial", "esthetique", 60, 1),
  prestation("hifu", "HIFU — lifting non chirurgical", "esthetique", 90, 2),
  prestation("epilation", "Épilation", "esthetique", 45, 3),
  prestation("ongles", "Manucure & pose d'ongles", "esthetique", 90, 4),
  prestation("make-up", "Make-up", "esthetique", 60, 5),
  // Les trois formules du Head Spa : le déroulé tient dans la description.
  prestation("head-spa-essentiel", "Pack Head Spa Essentiel", "bien-etre", 60, 19, "Nettoyage du cuir chevelu · Massage relaxant · Soin cheveux · Brushing"),
  prestation("head-spa-detente", "Pack Head Spa Détente", "bien-etre", 90, 20, "Nettoyage en profondeur · Massage cuir chevelu, nuque et épaules · Soin capillaire adapté · Vapeur · Brushing"),
  prestation("head-spa-signature", "Pack Head Spa Signature", "bien-etre", 120, 21, "Rituel Head Spa complet · Massage relaxant du cuir chevelu, nuque et épaules · Soin profond et vapeur · Soin capillaire premium · Brushing · Expérience bien-être complète"),
  // La carte des massages, dans l'ordre de l'affiche du salon.
  prestation("massage-relaxant", "Massage relaxant (californien)", "bien-etre", 60, 1, "Des pressions lentes et enveloppantes, pour relâcher."),
  prestation("massage-suedois", "Massage suédois", "bien-etre", 60, 2, "Plus appuyé, il dénoue les muscles fatigués."),
  prestation("huiles-essentielles", "Massage aux huiles essentielles", "bien-etre", 60, 3, "Des huiles choisies selon l'humeur du jour."),
  prestation("pierres-chaudes", "Massage aux pierres chaudes", "bien-etre", 75, 4, "La chaleur des pierres détend en profondeur."),
  prestation("massage-deep-tissue", "Massage deep tissue (tissus profonds)", "bien-etre", 60, 5, "Un travail lent sur les tensions installées."),
  prestation("massage-anti-stress", "Massage anti-stress", "bien-etre", 45, 6, "Une parenthèse calme, pour faire retomber la pression."),
  prestation("massage-dos-epaules", "Massage du dos et des épaules", "bien-etre", 30, 7, "Ciblé là où la journée s'accumule."),
  prestation("massage-jambes-lourdes", "Massage des jambes lourdes", "bien-etre", 45, 8, "Remonte des pieds aux cuisses, jambes allégées."),
  prestation("massage-reflexologie", "Massage des pieds (réflexologie plantaire)", "bien-etre", 45, 9, "Des points sous la voûte plantaire, détente générale."),
  prestation("massage-cranien", "Massage crânien (tête, nuque et épaules)", "bien-etre", 30, 10, "Tête, nuque et épaules, en position assise."),
  prestation("massage-visage-cuir-chevelu", "Massage visage et cuir chevelu", "bien-etre", 45, 11, "Effleurages du visage jusqu'au cuir chevelu."),
  prestation("massage-sportif", "Massage sportif", "bien-etre", 60, 12, "Rythme soutenu, avant ou après l'effort."),
  prestation("drainant", "Massage drainant (drainage lymphatique)", "bien-etre", 60, 13, "Des mouvements légers qui relancent la circulation."),
  prestation("massage-amincissant", "Massage amincissant / anti-cellulite", "bien-etre", 45, 14, "Palper-rouler sur les zones à lisser."),
  prestation("massage-prenatal", "Massage prénatal", "bien-etre", 60, 15, "Pour les femmes enceintes, sur le côté et en douceur."),
  prestation("massage-duo", "Massage en duo", "bien-etre", 60, 16, "À deux, dans la même cabine — en couple ou entre amis."),
  prestation("massage-bougies", "Massage aux bougies", "bien-etre", 60, 17, "La cire fond en huile tiède, versée sur la peau."),
  prestation("massage-pochons", "Massage aux pochons d'herbes chaudes", "bien-etre", 75, 18, "Des pochons d'herbes chauds, pressés le long du dos."),
];
