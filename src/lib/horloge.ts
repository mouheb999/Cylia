"use client";

import { useSyncExternalStore } from "react";

/**
 * L'heure courante, arrondie à la minute, partagée par tous les composants.
 *
 * « il y a 12 min » dépend de l'instant : le serveur écrirait une valeur, le
 * navigateur une autre, et React signalerait une hydratation divergente.
 * `useSyncExternalStore` répond exactement à ce cas — `null` au rendu serveur,
 * l'heure réelle une fois monté.
 *
 * Un seul minuteur pour toute la page, quel que soit le nombre de cartes
 * affichées : trente rendez-vous à l'écran ne font pas trente `setInterval`.
 */
const abonnes = new Set<() => void>();
let minuteur: ReturnType<typeof setInterval> | null = null;
let instantane = Date.now();

function sabonner(prevenir: () => void) {
  abonnes.add(prevenir);
  if (!minuteur) {
    minuteur = setInterval(() => {
      instantane = Date.now();
      for (const abonne of abonnes) abonne();
    }, 60_000);
  }
  return () => {
    abonnes.delete(prevenir);
    if (abonnes.size === 0 && minuteur) {
      clearInterval(minuteur);
      minuteur = null;
    }
  };
}

/** `null` tant que le composant n'est pas monté côté navigateur. */
export function useMinute(): number | null {
  return useSyncExternalStore(
    sabonner,
    () => instantane,
    () => null,
  );
}
