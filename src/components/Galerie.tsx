import { Texte } from "@/components/edition/Modifiable";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import type { PhotoGalerie } from "@/lib/supabase/types";
import GrilleGalerie, { type PhotoAffichee } from "./GrilleGalerie";

/**
 * Les réalisations du salon.
 *
 * Sans photo déposée, la section n'existe pas : le salon préfère ne rien
 * montrer plutôt que des photos qui ne sont pas les siennes. La première se
 * dépose depuis le panneau, page « Accueil ».
 */
export default function Galerie({ photos }: { photos: PhotoGalerie[] }) {
  if (photos.length === 0) return null;

  const affichees: PhotoAffichee[] = photos.map((p) => ({
    id: p.id,
    src: p.image_url,
    alt: p.alt,
  }));

  return (
    <section id="galerie" className="bg-cream px-4 pb-10">
      <div className="mb-5 text-center">
        <Texte
          cle="galerie.surtitre"
          titre="Sur-titre de la galerie"
          defaut={CONTENUS_DEFAUT["galerie.surtitre"]}
          balise="p"
          className="text-[10px] uppercase tracking-[0.3em] text-gold-deep"
        />
        <Texte
          cle="galerie.titre"
          titre="Titre de la galerie"
          defaut={CONTENUS_DEFAUT["galerie.titre"]}
          balise="h2"
          className="mt-2 font-serif text-2xl font-light text-ink"
        />
        <div className="gold-rule mx-auto mt-3 h-px w-16" aria-hidden="true" />
      </div>

      <GrilleGalerie photos={affichees} />
    </section>
  );
}
