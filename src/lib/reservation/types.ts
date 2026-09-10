export type CategorieId = "coiffure" | "esthetique" | "bien-etre";

export type Categorie = {
  id: CategorieId;
  nom: string;
  description: string;
};

export type Prestation = {
  id: string;
  nom: string;
  categorie: CategorieId;
  /** Durée du rendez-vous en minutes — sert au calcul des créneaux. */
  dureeMinutes: number;
};

/** Intervalle occupé dans la journée, en minutes depuis minuit. */
export type Intervalle = {
  debut: number;
  fin: number;
};

export type Creneau = {
  /** Heure de début au format "HH:MM". */
  heure: string;
  disponible: boolean;
};

export type NouvelleReservation = {
  /** Prestations du rendez-vous, dans l'ordre choisi. Leurs durées s'additionnent. */
  prestationIds: string[];
  /** Date au format "AAAA-MM-JJ". */
  date: string;
  /** Heure de début au format "HH:MM". */
  heure: string;
  nom: string;
  telephone: string;
  note?: string;
};

export type Reservation = NouvelleReservation & {
  /** Référence lisible communiquée à la cliente, ex. « CY-0912-4F7 ». */
  reference: string;
  creeLe: string;
};

/**
 * Point de bascule vers un vrai back-end.
 *
 * L'interface est volontairement asynchrone : l'implémentation actuelle
 * (`StoreLocal`) travaille dans le navigateur, une future implémentation
 * Supabase fera exactement les mêmes appels côté serveur sans que les
 * composants d'interface changent d'une ligne.
 */
export interface StoreReservations {
  /** Réservations déjà posées sur une date donnée (toutes clientes confondues). */
  reservationsDuJour(date: string): Promise<Reservation[]>;
  /** Enregistre une réservation et renvoie sa version complète (référence, date de création). */
  creer(demande: NouvelleReservation): Promise<Reservation>;
  /** Réservations prises depuis cet appareil. */
  mesReservations(): Promise<Reservation[]>;
}
