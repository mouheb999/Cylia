"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Panneau qui monte du bas de l'écran.
 *
 * Le site est d'abord consulté au téléphone, et c'est aussi au téléphone que le
 * salon modifiera son contenu : une feuille qui monte du bas tombe sous le
 * pouce, là où une fenêtre centrée oblige à viser.
 */
export default function Feuille({
  titre,
  sousTitre,
  onFermer,
  children,
}: {
  titre: string;
  sousTitre?: string;
  onFermer: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") onFermer();
    }
    document.addEventListener("keydown", surTouche);
    // Sans cela, le fond continue de défiler sous la feuille ouverte.
    const debordement = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = debordement;
    };
  }, [onFermer]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onFermer}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className="relative max-h-[88vh] w-full max-w-[32rem] overflow-y-auto rounded-t-3xl border-t border-gold/25 bg-noir-soft px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl shadow-black/60"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" aria-hidden="true" />

        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-light text-cream">{titre}</h2>
            {sousTitre && (
              <p className="mt-1 text-xs font-light leading-relaxed text-white/45">{sousTitre}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="-mr-1 -mt-1 shrink-0 rounded-full p-2 text-white/50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.4}>
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
