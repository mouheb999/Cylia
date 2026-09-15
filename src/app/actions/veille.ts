"use server";

import { adminConnecte, clientServeur } from "@/lib/supabase/serveur";
import type { Reservation } from "@/lib/supabase/types";

/**
 * Le filet du temps réel.
 *
 * Realtime tient une connexion ouverte : un téléphone qui passe en veille, un
 * tunnel qui saute, un réseau qui bascule du wifi à la 4G, et l'abonnement
 * meurt sans prévenir. Ce sondage — rare, et suspendu tant que l'onglet est
 * caché — rattrape ce que la connexion a laissé passer. Il sert aussi de seul
 * mécanisme tant que la migration 0017 n'a pas été jouée.
 */
export type ReponseVeille =
  | { ok: true; reservations: Reservation[] }
  | { ok: false };

export async function reservationsDepuis(depuisIso: string): Promise<ReponseVeille> {
  const admin = await adminConnecte();
  if (!admin) return { ok: false };

  try {
    const supabase = await clientServeur();
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .gt("cree_le", depuisIso)
      .order("cree_le", { ascending: false })
      .limit(20);
    if (error) throw error;
    return { ok: true, reservations: (data ?? []) as Reservation[] };
  } catch (erreur) {
    console.error("[cylia] veille des réservations :", erreur);
    return { ok: false };
  }
}
