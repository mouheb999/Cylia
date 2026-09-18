import type { NextConfig } from "next";

/**
 * Les photos déposées depuis le panneau vivent dans le stockage Supabase.
 * `next/image` refuse toute adresse distante non déclarée : on n'ouvre donc
 * que l'hôte du projet, lu dans l'environnement.
 *
 * Le repli n'est pas une coquetterie. Cette liste est figée au moment du
 * build : une variable déclarée pour l'exécution mais absente de la
 * construction donnait une liste vide, et l'optimiseur répondait alors « 400 »
 * à chaque photo du catalogue — un site entier de vignettes cassées, sans une
 * ligne d'erreur nulle part. À défaut, on retient donc l'hôte du salon, celui
 * que `.env.example` versionne déjà. Un seul hôte, jamais un joker : c'est
 * cette liste qui empêche le site de servir d'optimiseur d'images à autrui.
 */
const HOTE_SALON = "sybrraiyllmhlkwbfcod.supabase.co";

const hoteSupabase = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return HOTE_SALON;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: hoteSupabase,
        pathname: "/storage/v1/object/public/**",
      },
    ],

    /**
     * Une photo optimisée est gardée un an.
     *
     * Par défaut, Next la réoptimise dès qu'elle a quatre heures — et les
     * fichiers rapatriés du catalogue annoncent eux-mêmes `max-age=3600`. Deux
     * cents références repassent donc sans cesse à la moulinette pour un
     * résultat identique, ce qui épuise le quota d'optimisations de
     * l'hébergeur ; passé ce quota, l'optimiseur rend une erreur et la cliente
     * voit des vignettes cassées.
     *
     * Rien ne justifie cette dépense : ici, une adresse de photo ne change
     * jamais de contenu. Remplacer une photo depuis le panneau écrit un nouveau
     * nom de fichier (voir `components/edition/televerser.ts`), donc une
     * nouvelle adresse — qui n'a, par construction, rien en cache.
     */
    minimumCacheTTL: 31_536_000,
  },

  /**
   * L'agent de service ne doit jamais être servi depuis un cache.
   *
   * Un fichier statique de `public/` part avec les en-têtes de cache habituels ;
   * appliqués à `sw.js`, ils figent la version installée sur les téléphones du
   * salon. Une correction poussée aujourd'hui n'arriverait que le jour où le
   * cache expire — et un agent de service défaillant n'a aucun moyen d'être
   * remplacé de force.
   */
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
