import Link from "next/link";
import salon1 from "@/images/salon-1.jpg";
import DiaporamaAccueil from "@/components/DiaporamaAccueil";
import { ImageModifiable, Texte } from "@/components/edition/Modifiable";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import type { PhotoGalerie } from "@/lib/supabase/types";
import { IconArrow } from "./Icons";

/**
 * Le bandeau de l'accueil.
 *
 * Tant que le salon n'a déposé aucune photo de bandeau dans le panneau, on
 * garde exactement ce qu'il y avait : une image, celle du code ou celle de la
 * clé `hero.image`. Dès qu'il en dépose, elles prennent la place et se
 * relaient — une photo suffit, quatre valent mieux.
 *
 * Le titre est posé **au milieu** de la photo, pas dessous. Les deux blocs
 * occupent la même case d'une grille d'une seule cellule : ils se superposent
 * sans que le texte ait à être détaché de la page. La case prend la hauteur du
 * plus grand des deux — le salon peut donc rallonger son accroche depuis le
 * panneau sans que le texte déborde de la photo.
 */
export default function Hero({ photos = [] }: { photos?: PhotoGalerie[] }) {
  return (
    <section id="haut" className="grid bg-noir">
      <div className="relative col-start-1 row-start-1 aspect-[4/5] w-full">
        {photos.length > 0 ? (
          <DiaporamaAccueil photos={photos} className="object-cover object-center" />
        ) : (
          <ImageModifiable
            cle="hero.image"
            titre="Photo du bandeau"
            defaut={salon1}
            alt="La réception de la Maison de Beauté CYLIA à Sousse"
            conteneur="absolute inset-0"
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
        )}
        {/*
          Le voile suivait le texte : clair en haut, opaque en bas, là où les
          mots étaient posés. Le texte étant remonté au centre, c'est le centre
          qu'il faut assombrir — sans quoi le titre blanc passerait sur le
          comptoir clair de la réception. Le haut reste le plus transparent :
          c'est là qu'on voit encore le salon.
        */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-noir/25 via-noir/65 to-noir"
          aria-hidden="true"
        />
      </div>

      <div className="z-10 col-start-1 row-start-1 flex flex-col justify-center px-6 py-12 text-center">
        <Texte
          cle="hero.surtitre"
          titre="Sur-titre du bandeau"
          defaut={CONTENUS_DEFAUT["hero.surtitre"]}
          balise="p"
          className="text-[11px] font-light uppercase tracking-[0.3em] text-gold"
        />

        <h1 className="mt-5 font-serif text-[2.3rem] font-light leading-[1.12] text-white">
          <Texte cle="hero.titre" titre="Titre du bandeau" defaut={CONTENUS_DEFAUT["hero.titre"]} />
          <Texte
            cle="hero.titre_script"
            titre="Titre manuscrit du bandeau"
            defaut={CONTENUS_DEFAUT["hero.titre_script"]}
            balise="span"
            className="mt-1 block font-script text-[2.85rem] leading-[1.1] text-gold"
          />
        </h1>

        <Texte
          cle="hero.texte"
          titre="Phrase d'accroche"
          type="multiligne"
          defaut={CONTENUS_DEFAUT["hero.texte"]}
          balise="p"
          className="mt-5 whitespace-pre-line text-[0.95rem] font-light leading-relaxed text-white/75"
        />

        <Link
          href="/reserver"
          className="gold-gradient mx-auto mt-8 flex w-full max-w-[20rem] items-center justify-center gap-3 rounded-full py-4 font-serif text-lg text-noir shadow-lg shadow-black/40"
        >
          <Texte cle="hero.bouton" titre="Bouton du bandeau" defaut={CONTENUS_DEFAUT["hero.bouton"]} />
          <IconArrow className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
