import { Texte } from "@/components/edition/Modifiable";
import { AVIS_CLIENTES } from "@/lib/avis";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import CarrouselAvis from "./CarrouselAvis";
import { IconArrow } from "./Icons";

/**
 * Ce que disent nos clientes, juste avant le pied de page.
 *
 * Les avis sont écrits en texte, pas collés en captures d'écran : une capture
 * se recadre mal dans une vignette, se lit mal sur un téléphone, et Google ne
 * la lit pas du tout. Le lien mène à la fiche Google, où l'on peut vérifier
 * qu'ils sont bien réels — et en laisser un.
 */
export default function AvisClientes({ lienGoogle }: { lienGoogle: string }) {
  return (
    <section id="avis" className="scroll-mt-24 bg-cream px-4 pb-12 pt-4">
      <div className="mb-5 text-center">
        <Texte
          cle="avis.surtitre"
          titre="Sur-titre des avis"
          defaut={CONTENUS_DEFAUT["avis.surtitre"]}
          balise="p"
          className="text-[10px] uppercase tracking-[0.3em] text-gold-deep"
        />
        <Texte
          cle="avis.titre"
          titre="Titre des avis"
          defaut={CONTENUS_DEFAUT["avis.titre"]}
          balise="h2"
          className="mx-auto mt-2 max-w-[18rem] font-serif text-2xl font-light text-ink"
        />
        <div className="gold-rule mx-auto mt-3 h-px w-16" aria-hidden="true" />
      </div>

      <CarrouselAvis avis={AVIS_CLIENTES} />

      <a
        href={lienGoogle}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-auto mt-4 flex w-full max-w-[20rem] items-center justify-center gap-2 rounded-full border border-gold-deep/40 py-3 font-serif text-base text-gold-deep"
      >
        <Texte
          cle="avis.bouton"
          titre="Bouton des avis"
          defaut={CONTENUS_DEFAUT["avis.bouton"]}
        />
        <IconArrow className="h-4 w-4" />
      </a>
    </section>
  );
}
