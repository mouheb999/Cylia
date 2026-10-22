"use client";

import { useEffect, useRef } from "react";
import { trackMeta, type ArticleMeta } from "@/lib/meta/track";

/**
 * Signale à Meta qu'une fiche — produit ou coffret — a été vue.
 *
 * Posé dans la page serveur, il ne rend rien. Une fois par article : le
 * double montage du mode strict ne compte pas deux fois, et passer d'une
 * fiche à une autre (même composant, autre article) compte bien la seconde.
 */
export default function VueMeta({ id, name, priceTnd }: ArticleMeta) {
  const dejaVu = useRef<string | null>(null);

  useEffect(() => {
    if (dejaVu.current === id) return;
    dejaVu.current = id;
    trackMeta("ViewContent", [{ id, name, priceTnd }]);
  }, [id, name, priceTnd]);

  return null;
}
