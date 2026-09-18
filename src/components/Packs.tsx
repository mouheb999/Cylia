import Link from "next/link";
import PhotoDistante from "@/components/PhotoDistante";
import { Texte } from "@/components/edition/Modifiable";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import { formatPrix } from "@/lib/format";
import type { Pack } from "@/lib/supabase/types";
import { IconArrow } from "./Icons";

/**
 * « Nos packs » — les formules du salon.
 *
 * Elle remplace l'encart figé « Prenez soin de vous », qui était une photo et
 * deux lignes écrites dans le code. Ici, tout vient du panneau : le salon
 * ajoute un pack, le photographie, le range, le retire.
 *
 * Sans aucun pack, la section n'existe pas — comme les promotions. Une section
 * « Nos packs » vide se lirait comme une panne, là où son absence ne se
 * remarque pas.
 *
 * Chaque carte mène à la réservation : un pack qui plaît est un pack qu'on
 * prend dans le geste suivant.
 */
export default function Packs({ packs, devise }: { packs: Pack[]; devise: string }) {
  if (packs.length === 0) return null;

  return (
    <section id="packs" className="scroll-mt-24 bg-cream px-4 pb-10 pt-4">
      <div className="mb-5 text-center">
        <Texte
          cle="packs.surtitre"
          titre="Sur-titre des packs"
          defaut={CONTENUS_DEFAUT["packs.surtitre"]}
          balise="p"
          className="text-[10px] uppercase tracking-[0.3em] text-gold-deep"
        />
        <Texte
          cle="packs.titre"
          titre="Titre des packs"
          defaut={CONTENUS_DEFAUT["packs.titre"]}
          balise="h2"
          className="mt-2 font-serif text-2xl font-light text-ink"
        />
        <Texte
          cle="packs.texte"
          titre="Texte des packs"
          type="multiligne"
          defaut={CONTENUS_DEFAUT["packs.texte"]}
          balise="p"
          className="mx-auto mt-2 max-w-[24rem] whitespace-pre-line text-[0.8rem] font-light leading-relaxed text-muted"
        />
        <div className="gold-rule mx-auto mt-3 h-px w-16" aria-hidden="true" />
      </div>

      <ul className="grid grid-cols-2 gap-3">
        {packs.map((pack) => (
          <li key={pack.id}>
            <Link
              href="/reserver"
              className="press flex h-full flex-col overflow-hidden rounded-2xl border border-sand bg-white shadow-[0_2px_12px_rgba(42,37,33,0.04)]"
            >
              <span className="relative block aspect-[4/3] overflow-hidden bg-sand">
                <PhotoDistante
                  src={pack.image_url ?? ""}
                  alt={pack.nom}
                  fill
                  sizes="(max-width: 640px) 50vw, 220px"
                  className="object-cover"
                  // Sans photo — ou si elle refuse de s'afficher — l'initiale
                  // dorée tient la place, comme sur les fiches produits.
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
          </li>
        ))}
      </ul>
    </section>
  );
}
