"use client";

import { useEffect, useRef } from "react";
import { trackMeta, type ArticleMeta } from "@/lib/meta/track";

/**
 * Signale à Meta qu'un pack a été vu — le pendant, pour les rendez-vous, de
 * `VueMeta` sur une fiche de la boutique.
 *
 * Posé dans la page serveur, il ne rend rien. `articles` : les prestations
 * que le pack réserve ; `valeurTnd` : le prix du pack, ou à défaut le plus
 * bas de leurs prix. Une fois par pack, même sous le double montage du mode
 * strict.
 */
export default function VueMetaPack({
  cle,
  articles,
  valeurTnd,
}: {
  cle: string;
  articles: ArticleMeta[];
  valeurTnd: number;
}) {
  const dejaVu = useRef<string | null>(null);

  useEffect(() => {
    if (dejaVu.current === cle || articles.length === 0) return;
    dejaVu.current = cle;
    trackMeta("ViewContent", articles, { valeurTnd, categorie: "reservation" });
  }, [cle, articles, valeurTnd]);

  return null;
}
