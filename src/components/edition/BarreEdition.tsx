"use client";

import Link from "next/link";
import { useEdition } from "./ContexteEdition";

/**
 * Barre flottante réservée à l'administratrice connectée.
 *
 * Elle n'apparaît nulle part ailleurs : une visiteuse ne reçoit ni le bouton,
 * ni le texte, ni la moindre trace de son existence dans le HTML.
 */
export default function BarreEdition() {
  const { estAdmin, actif, basculer } = useEdition();
  if (!estAdmin) return null;

  return (
    <>
      {/* `fixed` et non `sticky` : la barre est rendue en fin de document, un
          élément collant s'y accrocherait au bas de la page au lieu de flotter
          sous l'en-tête. */}
      {actif && (
        <p className="fixed inset-x-4 top-[5.5rem] z-40 rounded-full border border-gold/30 bg-noir/90 px-4 py-2 text-center text-[0.7rem] font-light text-gold backdrop-blur-sm">
          Touchez un élément encadré pour le modifier
        </p>
      )}

      {/* La barre flotte au-dessus de la page : cette réserve empêche qu'elle
          masque la fin du pied de page. */}
      <div aria-hidden="true" className="h-20 shrink-0 bg-noir" />

      <div className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2 rounded-full border border-gold/30 bg-noir/95 p-1.5 shadow-lg shadow-black/50 backdrop-blur-sm">
          <button
            type="button"
            onClick={basculer}
            aria-pressed={actif}
            className={
              actif
                ? "gold-gradient rounded-full px-5 py-2.5 text-sm font-medium text-noir"
                : "rounded-full px-5 py-2.5 text-sm text-gold"
            }
          >
            {actif ? "Terminer" : "Modifier le site"}
          </button>
          <Link
            href="/admin"
            className="rounded-full px-4 py-2.5 text-sm font-light text-white/60"
          >
            Panneau
          </Link>
        </div>
      </div>
    </>
  );
}
