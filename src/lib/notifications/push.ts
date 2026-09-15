import "server-only";
import webpush, { WebPushError } from "web-push";
import { clientService } from "@/lib/supabase/service";
import { formatDateLongue, formatDuree, minutesVersHeure } from "@/lib/format";
import type { Reservation } from "@/lib/supabase/types";

/**
 * Notifications poussées vers les appareils du salon.
 *
 * C'est la réponse au seul vrai manque du panneau : il fallait l'ouvrir pour
 * apprendre qu'une cliente avait réservé. Une notification web arrive sur le
 * téléphone, application fermée, comme celle d'une messagerie — à condition que
 * le panneau ait été installé sur l'écran d'accueil (obligatoire sur iOS).
 *
 * Rien n'est facturé et aucun compte d'entreprise n'est nécessaire : le
 * navigateur parle directement au service de push de son éditeur, et les clés
 * VAPID ne servent qu'à prouver que l'envoi vient bien de ce site.
 */

const CLE_PUBLIQUE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const CLE_PRIVEE = process.env.VAPID_PRIVATE_KEY ?? "";
/** Adresse de contact exigée par la spécification, en cas d'abus signalé. */
const SUJET = process.env.VAPID_SUJET ?? "mailto:contact@cylia.tn";

export const pushConfigure = Boolean(CLE_PUBLIQUE && CLE_PRIVEE);

let vapidPose = false;

function poserVapid() {
  if (vapidPose) return;
  webpush.setVapidDetails(SUJET, CLE_PUBLIQUE, CLE_PRIVEE);
  vapidPose = true;
}

export type ChargeNotification = {
  titre: string;
  corps: string;
  /** Page ouverte au toucher de la notification. */
  url: string;
  /**
   * Deux notifications de même `tag` se remplacent au lieu de s'empiler : le
   * salon ne veut pas quinze bulles pour quinze demandes, il veut savoir
   * qu'il y en a.
   */
  tag: string;
};

/**
 * Envoie à tous les appareils enregistrés.
 *
 * Ne jette jamais : un rendez-vous enregistré ne doit pas être signalé comme
 * échoué parce qu'un téléphone a désinstallé la PWA. Les abonnements que le
 * service de push déclare morts (404, 410) sont effacés au passage — sans quoi
 * la table se remplirait d'appareils qui n'existent plus.
 */
export async function envoyerNotification(charge: ChargeNotification): Promise<number> {
  if (!pushConfigure) return 0;

  const supabase = clientService();
  if (!supabase) return 0;

  const { data, error } = await supabase
    .from("abonnements_push")
    .select("id, endpoint, p256dh, auth");

  if (error) {
    console.error("[cylia] lecture des abonnements push :", error);
    return 0;
  }

  const abonnements = data ?? [];
  if (abonnements.length === 0) return 0;

  poserVapid();
  const corps = JSON.stringify(charge);
  const perimes: string[] = [];
  let envoyees = 0;

  await Promise.all(
    abonnements.map(async (abonnement) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: abonnement.endpoint,
            keys: { p256dh: abonnement.p256dh, auth: abonnement.auth },
          },
          corps,
          { TTL: 60 * 60 * 12, urgency: "high" },
        );
        envoyees += 1;
      } catch (erreur) {
        if (erreur instanceof WebPushError && [404, 410].includes(erreur.statusCode)) {
          perimes.push(abonnement.id);
          return;
        }
        console.error("[cylia] envoi push :", erreur);
      }
    }),
  );

  if (perimes.length > 0) {
    await supabase.from("abonnements_push").delete().in("id", perimes);
  }

  return envoyees;
}

/** La notification qui compte : une cliente vient de demander un rendez-vous. */
export async function notifierNouvelleReservation(reservation: Reservation) {
  const prestations = reservation.prestations_nom.join(", ");
  return envoyerNotification({
    titre: "Nouvelle demande de rendez-vous",
    corps:
      `${reservation.nom} — ${formatDateLongue(reservation.date)} à ` +
      `${minutesVersHeure(reservation.heure_minutes)}` +
      ` (${formatDuree(reservation.duree_minutes)})\n${prestations}`,
    url: "/admin/reservations?vue=a-confirmer",
    tag: "reservation",
  });
}
