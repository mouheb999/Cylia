import Link from "next/link";
import PhotoDistante from "@/components/PhotoDistante";
import { IconArrow } from "@/components/Icons";
import { formatPrix } from "@/lib/format";
import { cheminPack, couverturePack } from "@/lib/packs";
import type { Pack } from "@/lib/supabase/types";

/**
 * La vignette d'un pack — sur l'accueil, dans la liste, au bas d'une fiche.
 *
 * Elle mène à la fiche du pack, jamais droit au tunnel de réservation. Une
 * formule qu'on touche, on veut d'abord la lire : ce qu'elle comprend, combien
 * de temps elle dure, à quoi ressemble la cabine. Le bouton qui réserve
 * l'attend en bas de la fiche, une fois ces questions réglées.
 */
export default function CartePack({ pack, devise }: { pack: Pack; devise: string }) {
  const couverture = couverturePack(pack);

  return (
    <Link
      href={cheminPack(pack)}
      className="press flex h-full flex-col overflow-hidden rounded-2xl border border-sand bg-white shadow-[0_2px_12px_rgba(42,37,33,0.04)]"
    >
      <span className="relative block aspect-[4/3] overflow-hidden bg-sand">
        <PhotoDistante
          src={couverture ?? ""}
          alt={pack.nom}
          fill
          sizes="(max-width: 640px) 50vw, 220px"
          className="object-cover"
          // Sans photo — ou si elle refuse de s'afficher — l'initiale dorée
          // tient la place, comme sur les fiches produits.
          repli={
            <span
              aria-hidden="true"
              className="flex h-full items-center justify-center font-script text-4xl text-gold-deep/60"
            >
              {pack.nom.trim().charAt(0) || "C"}
            </span>
          }
        />
      </span>

      <span className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
        <span className="font-serif text-[0.95rem] leading-snug text-ink">{pack.nom}</span>
        {pack.description && (
          <span className="mt-1 line-clamp-3 text-[0.72rem] font-light leading-snug text-muted">
            {pack.description}
          </span>
        )}
        <span className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="font-serif text-lg font-semibold leading-none text-gold-deep lining-nums">
            {pack.prix === null ? "Sur devis" : formatPrix(pack.prix, devise)}
          </span>
          <IconArrow className="ml-auto h-4 w-4 shrink-0 text-gold-deep" />
        </span>
      </span>
    </Link>
  );
}
