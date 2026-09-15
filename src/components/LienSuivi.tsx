"use client";

import type { ComponentProps, MouseEvent } from "react";
import { track } from "@/lib/fbq";

type Props = ComponentProps<"a"> & {
  /** Nom de l'évènement Meta — `Contact`, `FindLocation`… */
  evenement: string;
  /** Qualification du geste. Jamais de donnée personnelle ici. */
  parametres?: Record<string, string>;
};

/**
 * Un lien ordinaire, qui signale au passage qu'on l'a touché.
 *
 * Il existe pour une seule raison : les liens du pied de page — WhatsApp,
 * téléphone, itinéraire — vivent dans un composant serveur, où aucun `onClick`
 * n'est possible. Plutôt que de basculer tout le pied de page côté client,
 * seule l'ancre le devient ; tout le reste (mise en forme, contenu éditable)
 * reste rendu par le serveur et passe ici en `children`.
 *
 * L'apparence est celle que l'appelant lui donne : ce composant ne décide
 * d'aucune classe.
 */
export default function LienSuivi({ evenement, parametres, onClick, ...proprietes }: Props) {
  function auClic(declencheur: MouseEvent<HTMLAnchorElement>) {
    track(evenement, parametres);
    onClick?.(declencheur);
  }

  return <a {...proprietes} onClick={auClic} />;
}
