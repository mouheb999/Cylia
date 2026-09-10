import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CLE, SUPABASE_URL } from "./config";
import type { Database } from "./types";

/**
 * Client sans session, pour les lectures publiques.
 *
 * Il ne touche pas aux cookies — et c'est tout l'intérêt : un appel qui ne
 * dépend pas de la requête peut être mis en cache par Next, alors qu'un client
 * adossé aux cookies ne le peut jamais. Les tables lues ici sont de toute façon
 * ouvertes à `anon` ; il n'y a pas de session à porter.
 */
export const clientPublic = createClient<Database>(SUPABASE_URL, SUPABASE_CLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});
