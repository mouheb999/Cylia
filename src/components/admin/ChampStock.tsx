"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { definirStock } from "@/app/actions/admin";

/**
 * Quantité d'un produit, modifiable sur place.
 *
 * Un réapprovisionnement, c'est vingt produits à recompter : ouvrir vingt
 * fiches pour changer vingt nombres était le vrai frein. Ici la quantité se
 * corrige dans la liste, au pouce, et part toute seule.
 *
 * L'envoi attend une seconde après la dernière frappe : taper « 24 » ne fait
 * pas un enregistrement à 2 puis un à 24, et maintenir « + » n'en fait qu'un.
 * L'affichage suit la saisie sans attendre la réponse — le retour du serveur ne
 * sert qu'à signaler l'échec, jamais à confirmer ce que l'œil a déjà vu.
 */
export default function ChampStock({
  id,
  stock,
  compact = false,
}: {
  id: string;
  stock: number;
  /** Sans les boutons « − / + » : pour les écrans étroits. */
  compact?: boolean;
}) {
  const router = useRouter();
  const [valeur, setValeur] = useState(stock);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const enregistre = useRef(stock);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Le serveur reprend la main quand la fiche a été modifiée ailleurs — mais
  // jamais par-dessus une saisie que nous n'avons pas encore envoyée.
  useEffect(() => {
    if (minuteur.current === null && stock !== enregistre.current) {
      enregistre.current = stock;
      setValeur(stock);
    }
  }, [stock]);

  useEffect(() => () => {
    if (minuteur.current) clearTimeout(minuteur.current);
  }, []);

  function programmer(neuve: number) {
    const propre = Math.max(0, Math.min(100000, Math.round(neuve)));
    setValeur(propre);
    setErreur(null);
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => {
      minuteur.current = null;
      if (propre === enregistre.current) return;
      demarrer(async () => {
        const reponse = await definirStock(id, propre);
        if (!reponse.ok) {
          setErreur(reponse.message);
          setValeur(enregistre.current);
          return;
        }
        enregistre.current = propre;
        router.refresh();
      });
    }, 1000);
  }

  const bouton =
    "h-8 w-8 shrink-0 rounded-full border border-white/12 text-base text-white/70 " +
    "disabled:opacity-30 active:bg-white/10";

  return (
    <div className="shrink-0 text-right">
      <div className="flex items-center gap-1.5">
        {!compact && (
          <button
            type="button"
            aria-label="Une unité de moins"
            onClick={() => programmer(valeur - 1)}
            disabled={valeur <= 0}
            className={bouton}
          >
            −
          </button>
        )}

        <input
          type="number"
          inputMode="numeric"
          min={0}
          aria-label="Quantité en stock"
          value={valeur}
          onChange={(e) => programmer(Number(e.target.value))}
          onFocus={(e) => e.target.select()}
          className={`h-8 w-12 rounded-lg border bg-white/[0.04] text-center text-sm lining-nums
            [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none
            ${
              erreur
                ? "border-red-400/50 text-red-300"
                : valeur === 0
                  ? "border-red-400/30 text-red-300"
                  : "border-white/12 text-cream focus:border-gold"
            }`}
        />

        {!compact && (
          <button
            type="button"
            aria-label="Une unité de plus"
            onClick={() => programmer(valeur + 1)}
            className={bouton}
          >
            +
          </button>
        )}
      </div>

      <p
        className={`mt-1 text-[0.6rem] font-light ${
          erreur ? "text-red-300" : "text-white/30"
        }`}
      >
        {erreur ?? (enCours ? "enregistrement…" : valeur === 0 ? "rupture" : "en stock")}
      </p>
    </div>
  );
}
