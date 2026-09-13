"use client";

import { useEffect } from "react";

/**
 * Efface l'ancre de l'adresse une fois le saut fait.
 *
 * « Contact » mène à `/#contact`, qui est le pied de page. Le navigateur y
 * saute, et l'ancre **reste dans l'adresse** : chaque rafraîchissement
 * renvoyait alors au pied de page, y compris des heures plus tard. On laisse
 * donc le saut se faire, puis on retire l'ancre — le lien fonctionne toujours,
 * mais la page ne garde pas la mémoire du détour.
 *
 * `replaceState` n'ajoute rien à l'historique : le bouton « retour » se
 * comporte comme avant.
 */
export default function NettoyerAncre() {
  useEffect(() => {
    function effacer() {
      if (!window.location.hash) return;
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
      );
    }

    // Rechargement avec une ancre encore collée à l'adresse : c'est le cas que
    // l'on veut supprimer. On remonte en haut plutôt que de laisser le
    // navigateur déposer la visiteuse dans le pied de page.
    const navigation = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (navigation?.type === "reload" && window.location.hash) {
      window.scrollTo(0, 0);
      effacer();
      return;
    }

    // Arrivée par un lien : le saut d'abord, le nettoyage ensuite. Trop tôt,
    // et le navigateur n'aurait plus de cible à rejoindre.
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    function programmer() {
      clearTimeout(minuteur);
      minuteur = setTimeout(effacer, 800);
    }

    if (window.location.hash) programmer();
    window.addEventListener("hashchange", programmer);
    return () => {
      clearTimeout(minuteur);
      window.removeEventListener("hashchange", programmer);
    };
  }, []);

  return null;
}
