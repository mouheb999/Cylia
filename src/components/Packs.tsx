import Link from "next/link";
import GrillePacks from "@/components/packs/GrillePacks";
import { Texte } from "@/components/edition/Modifiable";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import type { Pack } from "@/lib/supabase/types";

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
 * Chaque carte mène à la fiche du pack, et non plus droit au tunnel de
 * réservation : la cliente arrivait dans une liste de prestations où la
 * formule qui l'avait arrêtée n'apparaissait nulle part. La fiche lui montre
 * d'abord ce que le pack comprend, puis lui tend le bouton qui le réserve.
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

      <GrillePacks packs={packs} devise={devise} />

      <Link
        href="/packs"
        className="mx-auto mt-5 flex w-full max-w-[20rem] items-center justify-center rounded-full border border-gold-deep/40 py-3 font-serif text-base text-gold-deep"
      >
        Voir tous nos packs
      </Link>
    </section>
  );
}
