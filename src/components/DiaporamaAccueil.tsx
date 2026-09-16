"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { PhotoGalerie } from "@/lib/supabase/types";

/** Temps qu'une photo reste seule à l'écran, avant le fondu suivant. */
const DUREE_PHOTO = 5500;
/** Durée du fondu — la même valeur qu'en CSS, plus bas. */
const DUREE_FONDU = 1200;

/**
 * Les photos du bandeau, qui se relaient toutes seules.
 *
 * Volontairement sans geste : on ne peut ni faire glisser, ni avancer d'une
 * flèche. Le bandeau est la première chose que la cliente voit en arrivant —
 * un carrousel qu'on peut attraper y transforme le premier contact en
 * manipulation, et sur un téléphone il capte surtout les doigts qui voulaient
 * faire défiler la page.
 *
 * Les photos sont toutes empilées et ne bougent jamais : seule l'opacité
 * change. Rien ne se déplace, donc rien ne repositionne la mise en page, et le
 * fondu reste fluide même sur un vieil appareil. Pas de pastilles non plus :
 * elles n'indiqueraient qu'un endroit où l'on ne peut pas aller.
 *
 * Quand le système demande moins d'animations, la relève s'arrête net : la
 * première photo reste, et le bandeau devient ce qu'il était avant — une
 * image fixe.
 */
export default function DiaporamaAccueil({
  photos,
  className = "",
  sizes = "100vw",
}: {
  photos: PhotoGalerie[];
  className?: string;
  sizes?: string;
}) {
  const [courante, setCourante] = useState(0);

  useEffect(() => {
    if (photos.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const minuteur = setInterval(() => {
      // Une minuterie continue de battre dans un onglet caché : la cliente
      // revient alors sur une photo qui a tourné sans elle, et parfois en
      // plein fondu. Tant que la page n'est pas regardée, on ne tourne pas.
      if (document.visibilityState !== "visible") return;
      setCourante((index) => (index + 1) % photos.length);
    }, DUREE_PHOTO);

    return () => clearInterval(minuteur);
  }, [photos.length]);

  if (photos.length === 0) return null;

  return (
    <>
      {photos.map((photo, index) => (
        <Image
          key={photo.id}
          src={photo.image_url}
          alt={photo.alt}
          fill
          sizes={sizes}
          // La première photo est ce qui accueille la visiteuse : elle ne doit
          // pas attendre son tour de chargement. Les suivantes ont cinq
          // secondes devant elles, elles peuvent venir tranquillement.
          priority={index === 0}
          className={`${className} transition-opacity ease-in-out ${
            index === courante ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDuration: `${DUREE_FONDU}ms` }}
          // Les photos masquées ne sont pas du contenu : elles ne doivent pas
          // être lues à la suite par un lecteur d'écran.
          aria-hidden={index !== courante}
        />
      ))}
    </>
  );
}
