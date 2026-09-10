import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_CLE, SUPABASE_URL, exigerConfig } from "./config";
import type { Database } from "./types";

/**
 * Client serveur adossé aux cookies de la requête.
 *
 * À créer à chaque requête, jamais à mettre en variable globale : la session
 * d'une visiteuse se retrouverait servie à la suivante.
 */
export async function clientServeur() {
  exigerConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_CLE, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesAPoser) {
        try {
          cookiesAPoser.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Appelé depuis un composant serveur : le rafraîchissement de session
          // est alors fait par `proxy.ts`, il n'y a rien à réparer ici.
        }
      },
    },
  });
}

/**
 * Administratrice connectée, ou `null`.
 *
 * `getUser()` — et non `getSession()` : la session vient d'un cookie que le
 * navigateur peut avoir bricolé, `getUser()` la fait valider par Supabase.
 * L'appartenance à `administrateurs` est ensuite vérifiée côté base.
 */
export async function adminConnecte() {
  try {
    const supabase = await clientServeur();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("administrateurs")
      .select("user_id, email, nom")
      .eq("user_id", user.id)
      .maybeSingle();

    return data ? { id: user.id, email: data.email ?? user.email ?? "", nom: data.nom } : null;
  } catch (erreur) {
    unstable_rethrow(erreur);
    // Cette fonction est appelée dans la mise en page racine, donc à chaque
    // page du site. Une coupure de Supabase doit faire disparaître la barre
    // d'édition, pas la page d'accueil. Le panneau, lui, redirige vers la
    // connexion — ce qui est le bon comportement quand la base est muette.
    console.error("[cylia] vérification de session impossible :", erreur);
    return null;
  }
}
