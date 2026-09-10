import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_CLE, SUPABASE_URL, exigerConfig } from "./config";
import type { Database } from "./types";

let client: SupabaseClient<Database> | null = null;

/**
 * Client sans session, pour les lectures publiques.
 *
 * Il ne touche pas aux cookies — et c'est tout l'intérêt : un appel qui ne
 * dépend pas de la requête peut être mis en cache par Next, alors qu'un client
 * adossé aux cookies ne le peut jamais. Les tables lues ici sont de toute façon
 * ouvertes à `anon` ; il n'y a pas de session à porter.
 *
 * Construit à la première utilisation, jamais au chargement du module :
 * `createClient` refuse une URL vide, et un site déployé sans variables
 * d'environnement doit s'afficher avec son catalogue de repli, pas refuser de
 * se construire.
 */
export function clientPublic(): SupabaseClient<Database> {
  exigerConfig();
  if (!client) {
    client = createClient<Database>(SUPABASE_URL, SUPABASE_CLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
