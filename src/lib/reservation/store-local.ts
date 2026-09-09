import type { NouvelleReservation, Reservation, StoreReservations } from "./types";

const CLE_STOCKAGE = "cylia.reservations.v1";

/** Référence lisible, ex. « CY-0912-4F7 ». */
function genererReference(date: string): string {
  const [, mois, jour] = date.split("-");
  const suffixe = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `CY-${jour}${mois}-${suffixe}`;
}

function lire(): Reservation[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    return brut ? (JSON.parse(brut) as Reservation[]) : [];
  } catch {
    // Navigation privée, stockage refusé, JSON corrompu : on repart d'une liste vide.
    return [];
  }
}

function ecrire(reservations: Reservation[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(reservations));
  } catch {
    // Le stockage peut être indisponible : la réservation reste valable pour la session.
  }
}

/**
 * Implémentation de démonstration : tout vit dans le navigateur de la visiteuse.
 *
 * Conséquence assumée tant qu'il n'y a pas de back-end : une réservation n'est
 * visible que sur l'appareil qui l'a prise, et le salon n'en est pas averti.
 * C'est le seul fichier à remplacer pour brancher Supabase.
 */
export const storeLocal: StoreReservations = {
  async reservationsDuJour(date) {
    return lire().filter((r) => r.date === date);
  },

  async creer(demande: NouvelleReservation) {
    const reservation: Reservation = {
      ...demande,
      reference: genererReference(demande.date),
      creeLe: new Date().toISOString(),
    };
    ecrire([...lire(), reservation]);
    return reservation;
  },

  async mesReservations() {
    return lire().sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
  },
};
