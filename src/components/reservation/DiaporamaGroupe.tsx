"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { Groupe } from "@/lib/supabase/types";

/**
 * Les photos d'un groupe, couverture en tête.
 *
 * `images` est la source ; `image_url` reste le repli des groupes créés avant
 * l'album — et des lignes corrigées directement dans la base, où personne ne
 * remplit les deux.
 */
export function photosDuGroupe(groupe: Groupe): string[] {
  if (groupe.images?.length) return groupe.images;
  return groupe.image_url ? [groupe.image_url] : [];
}

/**
 * Le bandeau du groupe ouvert : une photo pleine largeur, les autres à côté.
 *
 * Le défilement est celui du navigateur, avec un point d'accrochage par photo
 * — pas de minuterie, pas de librairie, rien qui bouge tout seul. Le seul
 * script ici sert à allumer la bonne pastille : `scrollLeft` divisé par la
 * largeur du cadre donne la photo au centre, et on n'écrit l'état que
 * lorsqu'il change vraiment.
 *
 * Sans photo, le composant ne rend rien. Un grand rectangle vide en haut de
 * chaque groupe se lirait comme une panne, là où son absence ne se remarque
 * pas — le salon dépose ses photos quand il les a.
 */
export default function DiaporamaGroupe({ groupe }: { groupe: Groupe }) {
  const photos = photosDuGroupe(groupe);
  const piste = useRef<HTMLDivElement>(null);
  const [courante, setCourante] = useState(0);

  if (photos.length === 0) return null;

  function auDefilement() {
    const element = piste.current;
    if (!element) return;
    const index = Math.round(element.scrollLeft / element.clientWidth);
    setCourante((precedente) => (precedente === index ? precedente : index));
  }

  function allerA(index: number) {
    const element = piste.current;
    if (!element) return;
    element.scrollTo({ left: index * element.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="-mx-5 mt-4">
      <div
        ref={piste}
        onScroll={auDefilement}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((url, index) => (
          <span key={url} className="relative block aspect-[4/3] w-full shrink-0 snap-center">
            <Image
              src={url}
              alt={
                photos.length > 1
                  ? `${groupe.nom} — photo ${index + 1} sur ${photos.length}`
                  : groupe.nom
              }
              fill
              sizes="(max-width: 640px) 100vw, 640px"
              className="object-cover"
              // La première photo est ce que la cliente voit en ouvrant le
              // groupe : elle ne doit pas attendre son tour de chargement.
              priority={index === 0}
            />
          </span>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {photos.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => allerA(index)}
              aria-label={`Photo ${index + 1}`}
              aria-current={index === courante}
              className={`h-1.5 rounded-full transition-all ${
                index === courante ? "w-5 bg-gold" : "w-1.5 bg-white/25"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
