import { formatPrix, pourcentageRemise } from "@/lib/format";

/**
 * Le prix d'une fiche — produit ou coffret — et ce qui l'accompagne.
 *
 * Avec un prix barré, la remise s'annonce aussi en pourcentage. Juste
 * dessous, la promesse de livraison : c'est au moment de lire le prix que la
 * cliente se demande comment elle va payer et recevoir.
 */
export default function PrixFiche({
  prix,
  prixBarre,
  devise,
  livraison = true,
}: {
  prix: number;
  prixBarre?: number | null;
  devise: string;
  /** Faux quand la boutique est fermée : rien ne se livre alors. */
  livraison?: boolean;
}) {
  const remise = pourcentageRemise(prix, prixBarre);

  return (
    <>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-serif text-[2rem] font-semibold leading-none text-gold-deep lining-nums">
          {formatPrix(prix, devise)}
        </span>
        {remise !== null && prixBarre != null && (
          <>
            <span className="text-sm font-light text-muted line-through lining-nums">
              {formatPrix(prixBarre, devise)}
            </span>
            <span className="self-center rounded-full bg-noir/85 px-2.5 py-0.5 text-[0.65rem] tracking-[0.12em] text-gold lining-nums">
              −{remise} %
            </span>
          </>
        )}
      </p>
      {livraison && (
        <p className="mt-2 text-xs font-light tracking-wide text-gold-deep">
          Livraison partout en Tunisie · Paiement à la livraison
        </p>
      )}
    </>
  );
}
