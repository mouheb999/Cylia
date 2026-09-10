import galerie1 from "@/images/galerie-1.jpg";
import galerie2 from "@/images/galerie-2.jpg";
import galerie3 from "@/images/galerie-3.jpg";
import galerie4 from "@/images/galerie-4.jpg";
import { Texte } from "@/components/edition/Modifiable";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import type { PhotoGalerie } from "@/lib/supabase/types";
import GrilleGalerie, { type PhotoAffichee } from "./GrilleGalerie";

/** Photos livrées avec le site, affichées tant que le salon n'a pas mis les siennes. */
const PHOTOS_ORIGINE: PhotoAffichee[] = [
  { id: null, src: galerie1, alt: "L'espace d'accueil de la Maison de Beauté CYLIA" },
  { id: null, src: galerie2, alt: "Soin du visage en cabine à la Maison de Beauté CYLIA" },
  { id: null, src: galerie3, alt: "La réception CYLIA et son logo lumineux" },
  { id: null, src: galerie4, alt: "Linge brodé et pinceaux de maquillage CYLIA" },
];

export default function Galerie({ photos }: { photos: PhotoGalerie[] }) {
  const affichees: PhotoAffichee[] =
    photos.length > 0
      ? photos.map((p) => ({ id: p.id, src: p.image_url, alt: p.alt }))
      : PHOTOS_ORIGINE;

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
