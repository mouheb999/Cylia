"use client";

import Image, { type ImageProps } from "next/image";
import { useState, type ReactNode } from "react";

/**
 * Une photo déposée sur Supabase — qui ne laisse jamais une vignette cassée.
 *
 * `next/image` ne sert pas le fichier : il fabrique une adresse `/_next/image`
 * que l'optimiseur de l'hébergeur doit honorer en allant chercher l'original.
 * Cette étape échoue pour des raisons qui n'ont rien à voir avec la photo :
 * quota d'optimisations épuisé chez l'hébergeur, hôte absent de
 * `remotePatterns` au moment du build, amont trop lent. Le navigateur montre
 * alors son carré gris barré d'un « ? » : la boutique a l'air en panne alors
 * que le fichier est bien là, intact, dans le bucket.
 *
 * On descend donc les marches une à une, sans que la cliente voie la chute :
 *
 *  1. la photo optimisée — la plus légère, le cas de tous les jours ;
 *  2. à défaut, le fichier d'origine servi directement par Supabase. Les
 *     packshots du catalogue sont des WebP de quelques dizaines de kilo-octets
 *     déjà à la bonne taille : s'en contenter coûte peu, et ne dépend plus de
 *     l'optimiseur ;
 *  3. à défaut encore, le repli dessiné par l'appelant — une initiale, une
 *     icône de catégorie — qui a toujours l'air voulu.
 */
export default function PhotoDistante({
  src,
  repli = null,
  ...props
}: Omit<ImageProps, "src" | "onError"> & {
  src: string;
  /** Ce qu'on montre quand même l'original refuse de s'afficher. */
  repli?: ReactNode;
}) {
  const [echec, setEchec] = useState({ url: src, marche: 0 });

  // Une autre photo — le salon vient de la remplacer depuis le panneau —
  // repart du haut de l'escalier : l'échec de la précédente ne la condamne pas.
  const marche = echec.url === src ? echec.marche : 0;

  if (marche > 1) return <>{repli}</>;

  return (
    // `alt` arrive par `props`, et le type le rend obligatoire à l'appel :
    // la règle ne sait pas le voir à travers l'étalement.
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image
      {...props}
      // Change à chaque marche : sans cela React garde l'élément en place, et
      // le navigateur reste sur son erreur au lieu de retenter le chargement.
      key={marche}
      src={src}
      unoptimized={marche === 1}
      onError={() => setEchec({ url: src, marche: marche + 1 })}
    />
  );
}
