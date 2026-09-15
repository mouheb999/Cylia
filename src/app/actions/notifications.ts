"use server";

import { adminConnecte, clientServeur } from "@/lib/supabase/serveur";
import { envoyerNotification, pushConfigure } from "@/lib/notifications/push";

export type Resultat = { ok: true } | { ok: false; message: string };

/** Ce que le navigateur remet après `pushManager.subscribe()`. */
export type AbonnementNavigateur = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/**
 * Enregistre l'appareil qui vient d'accepter les notifications.
 *
 * L'abonnement est rangé sous le compte de l'administratrice connectée : une
 * personne qui quitte le salon et dont le compte est supprimé emporte ses
 * appareils avec elle (`on delete cascade`).
 */
export async function enregistrerAbonnement(
  abonnement: AbonnementNavigateur,
  agent: string,
): Promise<Resultat> {
  const admin = await adminConnecte();
  if (!admin) return { ok: false, message: "Reconnectez-vous pour activer les alertes." };

  if (!abonnement?.endpoint || !abonnement.keys?.p256dh || !abonnement.keys?.auth) {
    return { ok: false, message: "Cet appareil n'a pas fourni d'abonnement valable." };
  }

  try {
    const supabase = await clientServeur();
    const { error } = await supabase.from("abonnements_push").upsert(
      {
        user_id: admin.id,
        endpoint: abonnement.endpoint,
        p256dh: abonnement.keys.p256dh,
        auth: abonnement.keys.auth,
        agent: agent.slice(0, 300),
        vu_le: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
    if (error) throw error;
    return { ok: true };
  } catch (erreur) {
    console.error("[cylia] enregistrement d'un abonnement push :", erreur);
    return { ok: false, message: "L'activation a échoué. Réessayez." };
  }
}

export async function supprimerAbonnement(endpoint: string): Promise<Resultat> {
  const admin = await adminConnecte();
  if (!admin) return { ok: false, message: "Reconnectez-vous." };

  try {
    const supabase = await clientServeur();
    const { error } = await supabase
      .from("abonnements_push")
      .delete()
      .eq("endpoint", endpoint);
    if (error) throw error;
    return { ok: true };
  } catch (erreur) {
    console.error("[cylia] retrait d'un abonnement push :", erreur);
    return { ok: false, message: "Le retrait a échoué. Réessayez." };
  }
}

/**
 * Notification d'essai.
 *
 * Elle part vers **tous** les appareils enregistrés, comme une vraie alerte :
 * c'est le seul essai qui prouve quelque chose. Accepter la permission dans le
 * navigateur ne dit pas encore que le téléphone recevra la bulle.
 */
export async function envoyerNotificationTest(): Promise<Resultat> {
  const admin = await adminConnecte();
  if (!admin) return { ok: false, message: "Reconnectez-vous." };

  if (!pushConfigure) {
    return {
      ok: false,
      message: "Les clés VAPID ne sont pas configurées sur le serveur.",
    };
  }

  const envoyees = await envoyerNotification({
    titre: "CYLIA — essai",
    corps: "Les alertes fonctionnent : une nouvelle demande arrivera comme ceci.",
    url: "/admin/reservations?vue=a-confirmer",
    tag: "essai",
  });

  return envoyees > 0
    ? { ok: true }
    : { ok: false, message: "Aucun appareil n'a reçu l'essai." };
}

/** Le serveur sait-il envoyer des notifications ? Lu par l'écran des réglages. */
export async function notificationsDisponibles(): Promise<boolean> {
  return pushConfigure;
}
