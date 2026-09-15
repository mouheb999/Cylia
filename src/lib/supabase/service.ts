import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SECRET, SUPABASE_URL, supabaseConfigure } from "./config";
import type { Database } from "./types";

let client: SupabaseClient<Database> | null = null;

/**
 * Client de service — passe outre RLS, ne sort jamais du serveur.
 *
 * Un seul appelant : l'envoi des notifications au salon. Une cliente qui
 * réserve n'a pas de session administratrice, et la liste des appareils du
 * salon n'est lisible que par une administratrice : sans ce client, la
 * notification ne pourrait pas partir depuis le parcours de réservation.
 *
 * Renvoie `null` quand la clé n'est pas configurée. L'appelant doit alors
 * renoncer à notifier, pas échouer — le rendez-vous, lui, est déjà pris.
 */
export function clientService(): SupabaseClient<Database> | null {
  if (!supabaseConfigure || !SUPABASE_SECRET) return null;
  if (!client) {
    client = createClient<Database>(SUPABASE_URL, SUPABASE_SECRET, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
