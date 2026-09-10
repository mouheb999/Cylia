import Link from "next/link";
import salon1 from "@/images/salon-1.jpg";
import { ImageModifiable, Texte } from "@/components/edition/Modifiable";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import { IconArrow } from "./Icons";

export default function Hero() {
  return (
    <section id="haut" className="bg-noir">
      <div className="relative aspect-[4/5] w-full">
        <ImageModifiable
          cle="hero.image"
          titre="Photo du bandeau"
          defaut={salon1}
          alt="Les postes de coiffure de la Maison de Beauté CYLIA à Sousse"
          conteneur="absolute inset-0"
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-noir/20 via-noir/45 to-noir"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 -mt-12 px-6 pb-14 text-center">
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
