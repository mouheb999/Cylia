"use client";

import { useEffect } from "react";

/**
 * Enregistre l'agent de service, une fois, au chargement.
 *
 * Il est enregistré pour tout le monde et pas seulement pour le salon : c'est
 * lui qui rend le site installable, et c'est lui qui montre une page plutôt que
 * le dinosaure du navigateur quand le réseau tombe — ce qui arrive à une
 * cliente en déplacement aussi souvent qu'à une coiffeuse au sous-sol.
 *
 * `updateViaCache: "none"` : le fichier est relu à chaque enregistrement, sinon
 * un agent corrigé pourrait rester en place des heures.
 */
export default function AgentService() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((erreur) => console.error("[cylia] agent de service :", erreur));
  }, []);

  return null;
}
