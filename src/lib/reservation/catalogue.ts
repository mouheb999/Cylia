import type { Categorie, Prestation } from "./types";

/**
 * Mode démonstration.
 *
 * `true`  : les créneaux occupés sont simulés et un bandeau le signale.
 * `false` : seules les vraies réservations occupent des créneaux.
 */
export const MODE_DEMO = true;

/** Horaires d'ouverture du salon — tous les jours, 10h–20h. */
export const HORAIRES = {
  ouverture: 10 * 60,
  fermeture: 20 * 60,
  /** Pas de la grille de créneaux, en minutes. */
  pas: 30,
  /** Délai minimum entre maintenant et un rendez-vous le jour même. */
  delaiMinimumMinutes: 60,
  /**
   * Nombre de rendez-vous que le salon peut mener de front (postes, cabines).
   * Un créneau n'est refusé que lorsque toutes les places sont prises.
   */
  capaciteSimultanee: 3,
};

/** Nombre de jours proposés dans le sélecteur de date. */
export const JOURS_PROPOSES = 14;

export const CATEGORIES: Categorie[] = [
  {
    id: "coiffure",
    nom: "Coiffure",
    description: "Coupe, couleur, soin & style",
  },
  {
    id: "esthetique",
    nom: "Esthétique",
    description: "Soins visage, épilation, ongles",
  },
  {
    id: "bien-etre",
    nom: "Bien-être",
    description: "Massages, relaxation, équilibre",
  },
];

/**
 * Catalogue des prestations.
 *
 * Les durées sont des valeurs de travail : c'est le seul endroit à corriger
 * pour coller aux durées réelles du salon. Aucun tarif n'est affiché tant que
 * la grille n'a pas été validée par le salon.
 */
export const PRESTATIONS: Prestation[] = [
  { id: "coupe-brushing", nom: "Coupe & brushing", categorie: "coiffure", dureeMinutes: 60 },
  { id: "coloration", nom: "Coloration", categorie: "coiffure", dureeMinutes: 120 },
  { id: "balayage", nom: "Balayage & mèches", categorie: "coiffure", dureeMinutes: 150 },
  { id: "soin-capillaire", nom: "Soin capillaire Keune", categorie: "coiffure", dureeMinutes: 45 },
  { id: "head-spa", nom: "Head Spa", categorie: "coiffure", dureeMinutes: 60 },

  { id: "hydrafacial", nom: "Soin visage Hydrafacial", categorie: "esthetique", dureeMinutes: 60 },
  { id: "hifu", nom: "HIFU — lifting non chirurgical", categorie: "esthetique", dureeMinutes: 90 },
  { id: "epilation", nom: "Épilation", categorie: "esthetique", dureeMinutes: 45 },
  { id: "ongles", nom: "Manucure & pose d'ongles", categorie: "esthetique", dureeMinutes: 90 },
  { id: "make-up", nom: "Make-up", categorie: "esthetique", dureeMinutes: 60 },

  { id: "massage-relaxant", nom: "Massage relaxant (californien)", categorie: "bien-etre", dureeMinutes: 60 },
  { id: "pierres-chaudes", nom: "Massage aux pierres chaudes", categorie: "bien-etre", dureeMinutes: 75 },
  { id: "huiles-essentielles", nom: "Massage aux huiles essentielles", categorie: "bien-etre", dureeMinutes: 60 },
  { id: "drainant", nom: "Massage drainant (drainage lymphatique)", categorie: "bien-etre", dureeMinutes: 60 },
  { id: "massage-duo", nom: "Massage en duo", categorie: "bien-etre", dureeMinutes: 60 },
];

export function prestationParId(id: string): Prestation | undefined {
  return PRESTATIONS.find((p) => p.id === id);
}

export function prestationsDeCategorie(categorie: string): Prestation[] {
  return PRESTATIONS.filter((p) => p.categorie === categorie);
}
