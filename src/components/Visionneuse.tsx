"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import PhotoDistante from "@/components/PhotoDistante";
import type { PhotoAffichee } from "@/components/GrilleGalerie";

/**
 * La galerie en plein écran, ouverte sur la photo touchée.
 *
 * Même mécanique que les diaporamas des fiches : le défilement est celui du
 * navigateur, avec un point d'accrochage par photo. Le doigt glisse d'une
 * photo à l'autre avec l'inertie du téléphone — aucune librairie, aucune
 * animation rejouée en script. Les flèches ne servent qu'à l'ordinateur,
 * où l'on n'a pas de doigt pour glisser.
 */
export default function Visionneuse({
  photos,
  depart,
  onFermer,
}: {
  photos: PhotoAffichee[];
  depart: number;
  onFermer: () => void;
}) {
  const piste = useRef<HTMLDivElement>(null);
  const [courante, setCourante] = useState(depart);

  // Avant le premier dessin : sans cela, on verrait la première photo, puis la
  // piste filer jusqu'à celle qu'on a touchée.
  useLayoutEffect(() => {
    const element = piste.current;
    if (element) element.scrollTo({ left: depart * element.clientWidth, behavior: "instant" });
  }, [depart]);

  function allerA(index: number) {
    const element = piste.current;
    if (!element) return;
    const borne = Math.max(0, Math.min(photos.length - 1, index));
    element.scrollTo({ left: borne * element.clientWidth, behavior: "smooth" });
  }

  useEffect(() => {
    // Au clavier, on part de la position de la piste plutôt que de l'état :
    // l'écouteur est posé une fois, et la piste, elle, est toujours à jour.
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") return onFermer();
      const sens = evenement.key === "ArrowRight" ? 1 : evenement.key === "ArrowLeft" ? -1 : 0;
      const element = piste.current;
      if (!sens || !element) return;
      const index = Math.round(element.scrollLeft / element.clientWidth) + sens;
      element.scrollTo({ left: index * element.clientWidth, behavior: "smooth" });
    }
    document.addEventListener("keydown", surTouche);
    // Sans cela, la page continue de défiler sous la visionneuse.
    const debordement = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = debordement;
    };
  }, [onFermer]);

  function auDefilement() {
    const element = piste.current;
    if (!element) return;
    const index = Math.round(element.scrollLeft / element.clientWidth);
    setCourante((precedente) => (precedente === index ? precedente : index));
  }

  const plusieurs = photos.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nos réalisations"
      className="visionneuse-entree fixed inset-0 z-[80] flex flex-col bg-noir/95 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="text-xs font-light tracking-[0.2em] text-white/55" aria-live="polite">
          {plusieurs ? `${courante + 1} / ${photos.length}` : ""}
        </p>
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="-mr-1 rounded-full p-2 text-white/70"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.4}>
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div
        ref={piste}
        onScroll={auDefilement}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo, index) => (
          <div
            key={photo.id ?? index}
            className="relative h-full w-full shrink-0 snap-center snap-always"
          >
            {typeof photo.src === "string" ? (
              <PhotoDistante
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="100vw"
                className="object-contain"
                priority={index === depart}
                repli={
                  <span
                    aria-hidden="true"
                    className="flex h-full items-center justify-center font-script text-7xl text-gold-deep/50"
                  >
                    C
                  </span>
                }
              />
            ) : (
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                placeholder="blur"
                sizes="100vw"
                className="object-contain"
                priority={index === depart}
              />
            )}
          </div>
        ))}
      </div>

      {plusieurs && (
        <>
          <button
            type="button"
            onClick={() => allerA(courante - 1)}
            disabled={courante === 0}
            aria-label="Photo précédente"
            className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-cream transition-opacity disabled:opacity-0 sm:flex"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => allerA(courante + 1)}
            disabled={courante === photos.length - 1}
            aria-label="Photo suivante"
            className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-cream transition-opacity disabled:opacity-0 sm:flex"
          >
            →
          </button>

          <div className="flex justify-center gap-1.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
            {photos.map((photo, index) => (
              <button
                key={photo.id ?? index}
                type="button"
                onClick={() => allerA(index)}
                aria-label={`Voir la photo ${index + 1}`}
                aria-current={index === courante}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === courante ? "w-5 bg-gold" : "w-1.5 bg-white/35"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
