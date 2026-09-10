import type { Reglages } from "@/lib/supabase/types";
import { minutesVersHeure } from "./format";

/** Intervalle occupé dans la journée, en minutes depuis minuit. */
export type Intervalle = { debut: number; fin: number };

export type Creneau = {
  /** Heure de début au format "HH:MM". */
  heure: string;
  /** Minutes depuis minuit — c'est cette valeur qui part vers la base. */
  minutes: number;
  disponible: boolean;
};

function seChevauchent(a: Intervalle, b: Intervalle): boolean {
  return a.debut < b.fin && b.debut < a.fin;
}

/**
 * Créneaux d'une journée pour une visite d'une durée donnée.
 *
 * Un créneau est proposé s'il tient entièrement dans les horaires d'ouverture
 * et s'il reste une place libre : le salon mène plusieurs rendez-vous de front
 * (`capacite_simultanee`), un horaire n'est donc refusé que lorsque tous les
 * postes sont occupés.
 *
 * Fonction pure — les mêmes entrées donnent toujours la même grille. Le calcul
 * est refait côté base au moment d'écrire (`creer_reservation`) : ici c'est de
 * l'affichage, là-bas c'est la vérité.
 */
export function creneauxDuJour({
  dureeMinutes,
  occupation,
  reglages,
  ferme = false,
  minutesEcoulees = null,
}: {
  dureeMinutes: number;
  occupation: Intervalle[];
  reglages: Reglages;
  /** Le salon est fermé ce jour-là (congé, férié). */
  ferme?: boolean;
  /** Minutes depuis minuit si la date est aujourd'hui, `null` sinon. */
  minutesEcoulees?: number | null;
}): Creneau[] {
  const plancher =
    minutesEcoulees === null ? 0 : minutesEcoulees + reglages.delai_minimum_minutes;

  const creneaux: Creneau[] = [];
  for (
    let debut = reglages.ouverture_minutes;
    debut + dureeMinutes <= reglages.fermeture_minutes;
    debut += reglages.pas_minutes
  ) {
    const candidat: Intervalle = { debut, fin: debut + dureeMinutes };
    const simultanes = occupation.filter((o) => seChevauchent(candidat, o)).length;
    creneaux.push({
      heure: minutesVersHeure(debut),
      minutes: debut,
      disponible:
        !ferme && debut >= plancher && simultanes < reglages.capacite_simultanee,
    });
  }

  return creneaux;
}

/** Amplitude d'ouverture : une visite plus longue ne tient pas dans une journée. */
export function amplitudeJournee(reglages: Reglages): number {
  return reglages.fermeture_minutes - reglages.ouverture_minutes;
}
