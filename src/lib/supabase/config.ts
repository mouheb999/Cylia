/**
 * Coordonnées publiques du projet Supabase.
 *
 * L'URL et la clé publiable partent de toute façon dans le navigateur : elles
 * n'ont rien de secret, c'est RLS qui protège les données. On les lit quand
 * même dans l'environnement pour pouvoir changer de projet sans toucher au
 * code — et on échoue franchement si elles manquent, plutôt que de laisser
 * une requête partir vers `undefined`.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_CLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabaseConfigure = Boolean(SUPABASE_URL && SUPABASE_CLE);

export function exigerConfig(): void {
  if (!supabaseConfigure) {
    throw new Error(
      "Supabase n'est pas configuré : renseignez NEXT_PUBLIC_SUPABASE_URL et " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (voir .env.example).",
    );
  }
}
