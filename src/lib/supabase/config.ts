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

/**
 * Délais au-delà desquels on cesse d'attendre Supabase.
 *
 * Sans plafond, une base qui ne répond pas ne renvoie pas une erreur : elle
 * fait attendre. Le rendu d'une page reste alors suspendu, le build dépasse sa
 * limite de 60 s par page, et une panne passagère devient un déploiement
 * échoué. Ces valeurs transforment « ça pend » en « ça a échoué », ce que le
 * code sait déjà traiter.
 */
export const DELAI_LECTURE = 6_000;
export const DELAI_ECRITURE = 15_000;
export const DELAI_SESSION = 8_000;

/** `fetch` qui abandonne au bout de `ms`, pour les clients qui n'exposent pas de signal. */
export function fetchAvecDelai(ms: number): typeof fetch {
  return (entree, options) =>
    fetch(entree, { ...options, signal: AbortSignal.timeout(ms) });
}
