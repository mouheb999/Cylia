import type { NextConfig } from "next";

/**
 * Les photos déposées depuis le panneau vivent dans le stockage Supabase.
 * `next/image` refuse toute adresse distante non déclarée : on n'ouvre donc
 * que l'hôte du projet, lu dans l'environnement.
 */
const hoteSupabase = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: hoteSupabase
      ? [{ protocol: "https", hostname: hoteSupabase, pathname: "/storage/v1/object/public/**" }]
      : [],
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
