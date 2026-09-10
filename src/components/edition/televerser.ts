"use client";

import { clientNavigateur } from "@/lib/supabase/client";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export const TAILLE_MAX = 8 * 1024 * 1024;

/**
 * Dépose une photo dans le bucket `media` et renvoie son adresse publique.
 *
 * Le fichier part du navigateur directement vers Supabase : il ne traverse
 * jamais le serveur Next, donc pas de limite de taille d'action serveur ni de
 * photo de 6 Mo encodée en base64 dans une requête.
 *
 * Chaque dépôt reçoit un nom unique. Remplacer une photo change donc son
 * adresse, et aucun cache — navigateur ou CDN — ne peut resservir l'ancienne.
 */
export async function televerserImage(fichier: File, dossier = "site"): Promise<string> {
  const extension = EXTENSIONS[fichier.type];
  if (!extension) {
    throw new Error("Format non accepté — utilisez un JPG, un PNG ou un WebP.");
  }
  if (fichier.size > TAILLE_MAX) {
    throw new Error("Photo trop lourde — 8 Mo au maximum.");
  }

  const supabase = clientNavigateur();
  const chemin = `${dossier}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("media").upload(chemin, fichier, {
    cacheControl: "31536000",
    contentType: fichier.type,
    upsert: false,
  });
  if (error) throw new Error("Le dépôt de la photo a échoué. Réessayez.");

  return supabase.storage.from("media").getPublicUrl(chemin).data.publicUrl;
}
