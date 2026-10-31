"use server";

import { cookies, headers } from "next/headers";
import { after } from "next/server";
import { clientPublic } from "@/lib/supabase/public";
import { notifierNouvelleReservation } from "@/lib/notifications/push";
import { DELAI_ECRITURE, DELAI_LECTURE } from "@/lib/supabase/config";
import { chargerDonnees, chargerPack } from "@/lib/donnees";
import { amplitudeJournee, creneauxDuJour } from "@/lib/creneaux";
import type { Creneau, Intervalle } from "@/lib/creneaux";
import { adresseIp, decouperNom, envoyerEvenementMeta } from "@/lib/meta/capi";
import {
  idEvenementReservation,
  parametresMeta,
  type ArticleMeta,
} from "@/lib/meta/track";
import { prestationsDuPack } from "@/lib/packs";
import { tarifDuJour } from "@/lib/promotions";
import { clesJours, maintenantSalon } from "@/lib/temps-salon";
import { mobileTunisienValide } from "@/lib/telephone";
import type { Prestation, Reservation } from "@/lib/supabase/types";

export type ReponseCreneaux =
  | { ok: true; creneaux: Creneau[]; dureeMinutes: number }
  | { ok: false; message: string };

const MESSAGES: Record<string, string> = {
  RESERVATIONS_FERMEES: "Les réservations en ligne sont momentanément suspendues.",
  NOM_INVALIDE: "Indiquez votre nom.",
  TELEPHONE_INVALIDE:
    "Numéro de mobile tunisien à 8 chiffres, commençant par 2, 4, 5 ou 9 — ex. 54 395 168.",
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

type Donnees = Awaited<ReturnType<typeof chargerDonnees>>;

/** Les prestations demandées, relues dans le catalogue — `null` si l'une manque. */
function prestationsChoisies(donnees: Donnees, prestationIds: string[]): Prestation[] | null {
  const choisies = prestationIds.map((id) => donnees.prestations.find((p) => p.id === id));
  if (choisies.length === 0 || choisies.some((p) => p === undefined)) return null;
  return choisies as Prestation[];
}

/** La grille d'un jour, occupation lue en base. Lève si la base ne répond pas. */
async function grilleDuJour(
  donnees: Donnees,
  dureeMinutes: number,
  dateCle: string,
): Promise<Creneau[]> {
  const { reglages, fermetures } = donnees;
  const maintenant = maintenantSalon();
  const ferme = fermetures.some((f) => f.debut <= dateCle && dateCle <= f.fin);

  // Un jour fermé n'a pas besoin de l'occupation : rien n'y sera proposé.
  let occupation: Intervalle[] = [];
  if (!ferme) {
    // Seule l'occupation du jour reste à demander : elle change d'une minute à
    // l'autre et ne peut pas être mise en cache. Le reste vient déjà du cache.
    const { data, error } = await clientPublic()
      .rpc("occupation_du_jour", { p_date: dateCle })
      .abortSignal(AbortSignal.timeout(DELAI_LECTURE));
    if (error) throw error;
    occupation = (data ?? []) as Intervalle[];
  }

  return creneauxDuJour({
    dureeMinutes,
    occupation,
    reglages,
    ferme,
    minutesEcoulees: dateCle === maintenant.dateCle ? maintenant.minutes : null,
  });
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
  const donnees = await chargerDonnees();
  const choisies = prestationsChoisies(donnees, prestationIds);
  if (!choisies) return { ok: false, message: MESSAGES.PRESTATIONS_INVALIDES };

  const dureeMinutes = choisies.reduce((total, p) => total + p.duree_minutes, 0);
  if (dureeMinutes > amplitudeJournee(donnees.reglages)) {
    return { ok: false, message: "Cette combinaison dépasse une journée d'ouverture." };
  }

  try {
    return { ok: true, dureeMinutes, creneaux: await grilleDuJour(donnees, dureeMinutes, dateCle) };
  } catch (erreur) {
    console.error("[cylia] disponibilités :", erreur);
    return {
      ok: false,
      message: "Les disponibilités ne sont pas accessibles pour le moment.",
    };
  }
}

export type ReponseJours =
  | { ok: true; jours: { cle: string; disponible: boolean }[] }
  | { ok: false; message: string };

/**
 * Pour chaque jour proposé : reste-t-il au moins un créneau assez long pour
 * toute la sélection ?
 *
 * C'est ce qui permet d'ouvrir le calendrier sur le premier jour utile et de
 * griser les autres — au lieu d'ouvrir sur « Aucun créneau » et de laisser la
 * cliente essayer les jours un par un. Les jours sont lus en parallèle ; un
 * jour dont l'occupation n'a pas pu être lue reste proposé : mieux vaut un
 * jour à vérifier qu'un jour libre caché.
 */
export async function joursDisponibles(prestationIds: string[]): Promise<ReponseJours> {
  const donnees = await chargerDonnees();
  const choisies = prestationsChoisies(donnees, prestationIds);
  if (!choisies) return { ok: false, message: MESSAGES.PRESTATIONS_INVALIDES };

  const dureeMinutes = choisies.reduce((total, p) => total + p.duree_minutes, 0);
  const cles = clesJours(donnees.reglages.jours_proposes);
  if (dureeMinutes > amplitudeJournee(donnees.reglages)) {
    return { ok: true, jours: cles.map((cle) => ({ cle, disponible: false })) };
  }

  const jours = await Promise.all(
    cles.map(async (cle) => {
      try {
        const grille = await grilleDuJour(donnees, dureeMinutes, cle);
        return { cle, disponible: grille.some((c) => c.disponible) };
      } catch (erreur) {
        console.error("[cylia] disponibilités du", cle, ":", erreur);
        return { cle, disponible: true };
      }
    }),
  );
  return { ok: true, jours };
}

/**
 * Ce que vaut le rendez-vous pour Meta : les prestations à leur tarif du jour,
 * et le total — le prix du pack quand le pack est complet, sinon le total que
 * `creer_reservation` a calculé en base.
 */
async function valeurDuRendezVous(
  donnees: Donnees,
  reservation: Reservation,
  packSlug: string | undefined,
): Promise<{ articles: ArticleMeta[]; valeurTnd: number }> {
  const aujourdhui = maintenantSalon().dateCle;
  const articles = reservation.prestation_ids.flatMap((id): ArticleMeta[] => {
    const p = donnees.prestations.find((x) => x.id === id);
    return p ? [{ id: p.id, name: p.nom, priceTnd: tarifDuJour(p, aujourdhui) ?? 0 }] : [];
  });
  let valeurTnd = Number(reservation.prix_total ?? articles.reduce((t, a) => t + a.priceTnd, 0));

  if (packSlug) {
    const pack = await chargerPack(packSlug);
    const incluses = pack ? prestationsDuPack(pack, donnees.prestations).map((p) => p.id) : [];
    if (
      pack?.prix != null &&
      incluses.length > 0 &&
      incluses.every((id) => reservation.prestation_ids.includes(id))
    ) {
      valeurTnd = pack.prix;
    }
  }
  return { articles, valeurTnd };
}

/**
 * Le rendez-vous, remonté à Meta par l'API Conversions.
 *
 * Il part du serveur, une fois le rendez-vous écrit en base. Le navigateur
 * envoie le même `Schedule` au pixel avec le même `eventID` —
 * `booking_<id>` — et les mêmes montants, renvoyés par `confirmerReservation`.
 */
async function signalerRendezVous(
  reservation: Reservation,
  meta: { articles: ArticleMeta[]; valeurTnd: number },
) {
  const [entetes, biscuits] = await Promise.all([headers(), cookies()]);
  await envoyerEvenementMeta({
    event: "Schedule",
    eventId: idEvenementReservation(reservation.id),
    params: parametresMeta(meta.articles, meta.valeurTnd, "reservation"),
    url: entetes.get("referer"),
    user: { phone: reservation.telephone, ...decouperNom(reservation.nom) },
    navigateur: {
      ip: adresseIp(entetes),
      userAgent: entetes.get("user-agent"),
      fbp: biscuits.get("_fbp")?.value ?? null,
      fbc: biscuits.get("_fbc")?.value ?? null,
    },
  });
}

export type ReponseReservation =
  | {
      ok: true;
      reservation: Reservation;
      /** Ce que le pixel doit envoyer pour coller à l'envoi serveur. */
      meta: { eventId: string; articles: ArticleMeta[]; valeurTnd: number };
    }
  | { ok: false; message: string };

/**
 * `packSlug` : le pack arrivé par `?pack=`. Il ne change rien au rendez-vous —
 * la base calcule son propre total — mais c'est son prix que Meta reçoit
 * quand toutes ses prestations sont retenues.
 *
 * Le téléphone est revérifié ici : le formulaire le contrôle déjà, mais une
 * action serveur s'appelle sans passer par lui.
 */
export async function confirmerReservation(demande: {
  prestationIds: string[];
  dateCle: string;
  heureMinutes: number;
  nom: string;
  telephone: string;
  note?: string;
  packSlug?: string;
}): Promise<ReponseReservation> {
  if (!mobileTunisienValide(demande.telephone)) {
    return { ok: false, message: MESSAGES.TELEPHONE_INVALIDE };
  }
  try {
    const { data, error } = await clientPublic().rpc("creer_reservation", {
      p_prestation_ids: demande.prestationIds,
      p_date: demande.dateCle,
      p_heure_minutes: demande.heureMinutes,
      p_nom: demande.nom,
      p_telephone: demande.telephone,
      p_note: demande.note ?? null,
    })
      // Plus patient qu'une lecture : abandonner une écriture qui a peut-être
      // abouti laisserait la cliente devant une erreur et le salon avec un
      // rendez-vous.
      .abortSignal(AbortSignal.timeout(DELAI_ECRITURE));
    if (error) throw error;

    const reservation = data as Reservation;
    // Le rendez-vous est écrit : une mesure qui échoue ne doit pas le faire
    // passer pour un échec aux yeux de la cliente.
    const meta = await valeurDuRendezVous(
      await chargerDonnees(),
      reservation,
      demande.packSlug,
    ).catch((erreur) => {
      console.error("[cylia] valeur du rendez-vous pour Meta :", erreur);
      return { articles: [] as ArticleMeta[], valeurTnd: Number(reservation.prix_total ?? 0) };
    });

    // `after` rend la main à la cliente tout de suite : elle voit sa confirmation
    // pendant que la notification part. Un service de push lent — ou en panne —
    // ne doit pas allonger d'une seconde le dernier écran du tunnel, ni faire
    // échouer un rendez-vous qui est déjà écrit en base.
    after(async () => {
      try {
        await notifierNouvelleReservation(reservation);
      } catch (erreur) {
        console.error("[cylia] notification du salon :", erreur);
      }
    });
    // Après la réponse, comme la notification : la cliente voit sa
    // confirmation sans attendre Meta.
    if (meta.articles.length > 0) after(() => signalerRendezVous(reservation, meta));

    return {
      ok: true,
      reservation,
      meta: { eventId: idEvenementReservation(reservation.id), ...meta },
    };
  } catch (erreur) {
    return { ok: false, message: messageErreur(erreur) };
  }
}
