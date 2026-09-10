"use server";

import { clientPublic } from "@/lib/supabase/public";
import { chargerDonnees } from "@/lib/donnees";
import { amplitudeJournee, creneauxDuJour } from "@/lib/creneaux";
import type { Creneau, Intervalle } from "@/lib/creneaux";
import { clesJours, maintenantSalon } from "@/lib/temps-salon";
import type { Reservation } from "@/lib/supabase/types";

export type ReponseCreneaux =
  | { ok: true; creneaux: Creneau[]; dureeMinutes: number }
  | { ok: false; message: string };

const MESSAGES: Record<string, string> = {
  RESERVATIONS_FERMEES: "Les réservations en ligne sont momentanément suspendues.",
  NOM_INVALIDE: "Indiquez votre nom.",
  TELEPHONE_INVALIDE: "Numéro à 8 chiffres, ex. 54 395 168.",
  NOTE_TROP_LONGUE: "Votre précision est trop longue.",
  PRESTATIONS_INVALIDES: "Votre sélection n'est plus valable — reprenez le choix des prestations.",
  DATE_PASSEE: "Cette date est déjà passée.",
  DATE_TROP_LOIN: "Cette date est trop éloignée.",
  HORAIRE_INVALIDE: "Ce créneau ne tient pas dans les horaires du salon.",
  CRENEAU_TROP_PROCHE: "Ce créneau est trop proche — choisissez un horaire plus tard.",
  SALON_FERME: "Le salon est fermé ce jour-là.",
  CRENEAU_INDISPONIBLE: "Ce créneau vient d'être pris. Choisissez-en un autre.",
};

/** Traduit une erreur Postgres en phrase lisible, sans jamais montrer le SQL. */
function messageErreur(erreur: unknown): string {
  const brut = erreur instanceof Error ? erreur.message : String(erreur);
  for (const [code, phrase] of Object.entries(MESSAGES)) {
    if (brut.includes(code)) return phrase;
  }
  console.error("[cylia] réservation :", erreur);
  return "La réservation n'a pas pu être enregistrée. Réessayez dans un instant.";
}

/** Dates proposées dans le sélecteur, calculées à l'heure du salon. */
export async function joursReservables(): Promise<string[]> {
  const { reglages } = await chargerDonnees();
  return clesJours(reglages.jours_proposes);
}

/**
 * Grille des créneaux d'une journée pour une sélection de prestations.
 *
 * La durée n'est jamais celle annoncée par le navigateur : elle est relue dans
 * le catalogue, comme le fait la base au moment d'écrire.
 */
export async function creneauxDisponibles(
  prestationIds: string[],
  dateCle: string,
): Promise<ReponseCreneaux> {
  const { reglages, prestations, fermetures } = await chargerDonnees();

  const choisies = prestationIds.map((id) => prestations.find((p) => p.id === id));
  if (choisies.length === 0 || choisies.some((p) => p === undefined)) {
    return { ok: false, message: MESSAGES.PRESTATIONS_INVALIDES };
  }

  const dureeMinutes = choisies.reduce((total, p) => total + (p?.duree_minutes ?? 0), 0);
  if (dureeMinutes > amplitudeJournee(reglages)) {
    return { ok: false, message: "Cette combinaison dépasse une journée d'ouverture." };
  }

  const maintenant = maintenantSalon();
  const ferme = fermetures.some((f) => f.debut <= dateCle && dateCle <= f.fin);
  let occupation: Intervalle[] = [];

  // Seule l'occupation du jour reste à demander : elle change d'une minute à
  // l'autre et ne peut pas être mise en cache. Le reste vient déjà du cache.
  try {
    const { data, error } = await clientPublic().rpc("occupation_du_jour", {
      p_date: dateCle,
    });
    if (error) throw error;
    occupation = (data ?? []) as Intervalle[];
  } catch (erreur) {
    console.error("[cylia] disponibilités :", erreur);
    return {
      ok: false,
      message: "Les disponibilités ne sont pas accessibles pour le moment.",
    };
  }

  return {
    ok: true,
    dureeMinutes,
    creneaux: creneauxDuJour({
      dureeMinutes,
      occupation,
      reglages,
      ferme,
      minutesEcoulees: dateCle === maintenant.dateCle ? maintenant.minutes : null,
    }),
  };
}

export type ReponseReservation =
  | { ok: true; reservation: Reservation }
  | { ok: false; message: string };

export async function confirmerReservation(demande: {
  prestationIds: string[];
  dateCle: string;
  heureMinutes: number;
  nom: string;
  telephone: string;
  note?: string;
}): Promise<ReponseReservation> {
  try {
    const { data, error } = await clientPublic().rpc("creer_reservation", {
      p_prestation_ids: demande.prestationIds,
      p_date: demande.dateCle,
      p_heure_minutes: demande.heureMinutes,
      p_nom: demande.nom,
      p_telephone: demande.telephone,
      p_note: demande.note ?? null,
    });
    if (error) throw error;
    return { ok: true, reservation: data as Reservation };
  } catch (erreur) {
    return { ok: false, message: messageErreur(erreur) };
  }
}
