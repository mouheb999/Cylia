"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_CLE, SUPABASE_URL, exigerConfig } from "./config";
import type { Database } from "./types";

/**
 * Client navigateur — connexion de l'administratrice, dépôt de photos.
 *
 * `createBrowserClient` mémoïse déjà l'instance : appeler cette fonction à
 * chaque rendu ne crée pas dix clients.
 */
export function clientNavigateur() {
  exigerConfig();
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_CLE);
}
