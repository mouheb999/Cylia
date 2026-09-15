import { formatDateLongue, minutesVersHeure } from "@/lib/format";
import { prenom } from "@/lib/telephone";
import type { Reservation, StatutReservation } from "@/lib/supabase/types";

/**
 * Messages WhatsApp pré-écrits, un par geste du salon.
 *
 * Le salon écrit vingt fois par jour la même phrase à une lettre près. Ce qui
 * coûte, ce n'est pas la frappe : c'est de reprendre la date, l'heure et la
 * liste des prestations dans un autre écran sans se tromper de cliente. Le
 * message part donc déjà écrit, et reste modifiable dans WhatsApp avant envoi —
 * personne n'envoie un message qu'il n'a pas relu.
 */

export type GesteMessage = "confirmer" | "rappeler" | "annuler" | "remercier";

const NOM_SALON = "CYLIA Maison de Beauté";

function entete(reservation: Reservation): string {
  return (
    `${formatDateLongue(reservation.date)} à ${minutesVersHeure(reservation.heure_minutes)}` +
    ` — ${reservation.prestations_nom.join(", ")}`
  );
}

export function messageWhatsApp(
  geste: GesteMessage,
  reservation: Reservation,
): string {
  const bonjour = `Bonjour ${prenom(reservation.nom)}`;
  const quand = entete(reservation);

  switch (geste) {
    case "confirmer":
      return (
        `${bonjour}, ici ${NOM_SALON}.\n\n` +
        `Nous avons bien reçu votre demande de rendez-vous :\n${quand}\n` +
        `Référence ${reservation.reference}.\n\n` +
        `Pouvons-nous la confirmer ?`
      );

    case "rappeler":
      return (
        `${bonjour}, ici ${NOM_SALON}.\n\n` +
        `Petit rappel de votre rendez-vous :\n${quand}\n\n` +
        `À très vite !`
      );

    case "annuler":
      return (
        `${bonjour}, ici ${NOM_SALON}.\n\n` +
        `Nous sommes désolées : votre rendez-vous du ${formatDateLongue(reservation.date)} ` +
        `à ${minutesVersHeure(reservation.heure_minutes)} ne peut pas être maintenu.\n\n` +
        `Souhaitez-vous que nous vous proposions un autre créneau ?`
      );

    case "remercier":
      return (
        `${bonjour}, ici ${NOM_SALON}.\n\n` +
        `Merci de votre visite — nous espérons que tout vous a plu.\n` +
        `À bientôt !`
      );
  }
}

/** Le geste qui vient naturellement selon l'état du rendez-vous. */
export function gesteParDefaut(statut: StatutReservation): GesteMessage {
  switch (statut) {
    case "en_attente":
      return "confirmer";
    case "confirmee":
      return "rappeler";
    case "terminee":
      return "remercier";
    case "annulee":
      return "annuler";
  }
}

export const LIBELLES_GESTE: Record<GesteMessage, string> = {
  confirmer: "Demander confirmation",
  rappeler: "Rappeler le rendez-vous",
  annuler: "Annoncer l'annulation",
  remercier: "Remercier après la visite",
};
