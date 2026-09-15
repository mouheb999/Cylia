"use client";

import { useLinkStatus } from "next/link";

/**
 * Le trait qui dit « c'est parti » sous un lien qu'on vient de toucher.
 *
 * `useLinkStatus` ne renseigne que les descendants d'un `<Link>` : ce composant
 * se place donc **dans** le lien, pas à côté. Il ne remplace pas les squelettes
 * de `loading.tsx` — il couvre l'instant d'avant, celui où la navigation est
 * partie mais où la page destination n'a encore rien remplacé à l'écran. C'est
 * exactement l'instant pendant lequel on croit que le clic n'a pas été pris.
 *
 * Toujours rendu, jamais conditionnel : apparaître déplacerait ce qui l'entoure.
 */
export default function IndicateurLien({ className = "" }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`lien-attente ${className}`}
      data-attente={pending ? "oui" : "non"}
    />
  );
}
