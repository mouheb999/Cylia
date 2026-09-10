import Image from "next/image";
import Link from "next/link";
import { IconArrow } from "./Icons";

export default function Hero() {
  return (
    <section id="haut" className="bg-noir">
      <div className="relative aspect-[4/5] w-full">
        <Image
          src="/salon-1.jpg"
          alt="Les postes de coiffure de la Maison de Beauté CYLIA à Sousse"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-noir/20 via-noir/45 to-noir"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 -mt-12 px-6 pb-14 text-center">
        <p className="text-[11px] font-light uppercase tracking-[0.3em] text-gold">
          Votre beauté, notre priorité
        </p>

        <h1 className="mt-5 font-serif text-[2.3rem] font-light leading-[1.12] text-white">
          Une expérience beauté
          <span className="mt-1 block font-script text-[2.85rem] leading-[1.1] text-gold">
            sur mesure
          </span>
        </h1>

        <p className="mt-5 text-[0.95rem] font-light leading-relaxed text-white/75">
          Soins, esthétique, coiffure et bien-être
          <br />
          dans un seul lieu.
        </p>

        <Link
          href="/reserver"
          className="gold-gradient mx-auto mt-8 flex w-full max-w-[20rem] items-center justify-center gap-3 rounded-full py-4 font-serif text-lg text-noir shadow-lg shadow-black/40"
        >
          Réserver
          <IconArrow className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
