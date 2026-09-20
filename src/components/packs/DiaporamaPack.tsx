"use client";

import { useRef, useState } from "react";
import PhotoDistante from "@/components/PhotoDistante";

/**
 * Les photos d'une fiche de pack, couverture en tête.
 *
 * Même mécanique que le bandeau des groupes : le défilement est celui du
 * navigateur, avec un point d'accrochage par photo — pas de minuterie, pas de
 * librairie, rien qui bouge tout seul. Le seul script sert à allumer la bonne
 * pastille.
 *
 * Sans photo, rien n'est rendu : la fiche commence alors par son titre, ce qui
 * vaut mieux qu'un grand rectangle vide qui se lirait comme une panne.
 */
export default function DiaporamaPack({
  photos,
  nom,
}: {
  photos: string[];
  nom: string;
}) {
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
    <div className="relative bg-sand">
      <div
        ref={piste}
        onScroll={auDefilement}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((url, index) => (
          <span key={url} className="relative block aspect-[4/3] w-full shrink-0 snap-center">
            <PhotoDistante
              src={url}
              alt={
                photos.length > 1 ? `${nom} — photo ${index + 1} sur ${photos.length}` : nom
              }
              fill
              // La fiche va d'un bord à l'autre : annoncer une largeur fixe
              // ferait télécharger une vignette pour l'étirer sur tout l'écran.
              sizes="100vw"
              className="object-cover"
              // La première photo est ce que la cliente voit en ouvrant la
              // fiche : elle ne doit pas attendre son tour de chargement.
              priority={index === 0}
              repli={
                <span
                  aria-hidden="true"
                  className="flex h-full items-center justify-center font-script text-6xl text-gold-deep/50"
                >
                  {nom.trim().charAt(0) || "C"}
                </span>
              }
            />
          </span>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {photos.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => allerA(index)}
              aria-label={`Photo ${index + 1}`}
              aria-current={index === courante}
              className={`h-1.5 rounded-full transition-all ${
                index === courante ? "w-5 bg-gold" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
