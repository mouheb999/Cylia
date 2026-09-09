"use client";

import dynamic from "next/dynamic";

/**
 * Le tunnel de réservation dépend de la date et du fuseau de la visiteuse.
 * On le charge uniquement côté navigateur : pas de rendu serveur, donc aucun
 * risque d'écart d'hydratation entre « aujourd'hui » du serveur et celui du
 * téléphone.
 */
const FluxReservation = dynamic(() => import("./FluxReservation"), {
  ssr: false,
  loading: () => (
    <p className="px-5 py-16 text-center text-sm font-light text-white/40">
      Chargement des disponibilités…
    </p>
  ),
});

export default function FluxReservationClient() {
  return <FluxReservation />;
}
