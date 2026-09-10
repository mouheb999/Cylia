import Link from "next/link";
import salon2 from "@/images/salon-2.jpg";
import { ImageModifiable, Texte } from "@/components/edition/Modifiable";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import { IconArrow } from "./Icons";

export default function Feature() {
  return (
    <section className="bg-cream px-4 pb-8 pt-2">
      <div className="relative isolate h-[200px] overflow-hidden rounded-2xl">
        <ImageModifiable
          cle="feature.image"
          titre="Photo « Prenez soin de vous »"
          defaut={salon2}
          alt="Soin du visage à la Maison de Beauté CYLIA"
          conteneur="absolute inset-0"
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-l from-noir/90 via-noir/65 to-noir/25"
          aria-hidden="true"
        />

        <Link
          href="/reserver"
          aria-label="Prenez soin de vous — réserver un soin"
          className="relative z-10 flex h-full items-center justify-end px-6 py-5 text-right"
        >
          <p className="font-serif text-[1.75rem] font-light leading-tight text-white">
            <Texte
              cle="feature.titre"
              titre="Titre de l'encart"
              defaut={CONTENUS_DEFAUT["feature.titre"]}
            />
            <Texte
              cle="feature.titre_script"
              titre="Titre manuscrit de l'encart"
              defaut={CONTENUS_DEFAUT["feature.titre_script"]}
              balise="span"
              className="mt-0.5 block font-script text-[2.1rem] leading-tight text-gold"
            />
            <IconArrow className="ml-auto mt-2 h-5 w-5 text-gold" />
          </p>
        </Link>
      </div>
    </section>
  );
}
