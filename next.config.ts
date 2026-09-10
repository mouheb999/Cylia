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
};

export default nextConfig;
