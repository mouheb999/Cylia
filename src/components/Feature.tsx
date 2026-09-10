import Image from "next/image";
import Link from "next/link";
import salon2 from "@/images/salon-2.jpg";
import { IconArrow } from "./Icons";

export default function Feature() {
  return (
    <section className="bg-cream px-4 pb-8 pt-2">
      <Link
        href="/reserver"
        aria-label="Prenez soin de vous — réserver un soin"
        className="relative isolate flex h-[200px] items-center justify-end overflow-hidden rounded-2xl"
      >
        <Image
          src={salon2}
          alt="Soin du visage à la Maison de Beauté CYLIA"
          fill
          placeholder="blur"
          sizes="100vw"
          className="-z-10 object-cover object-center"
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-l from-noir/90 via-noir/65 to-noir/25"
          aria-hidden="true"
        />

        <div className="px-6 py-5 text-right">
          <p className="font-serif text-[1.75rem] font-light leading-tight text-white">
            Prenez soin
            <span className="mt-0.5 block font-script text-[2.1rem] leading-tight text-gold">
              de vous
            </span>
          </p>
          <IconArrow className="ml-auto mt-2 h-5 w-5 text-gold" />
        </div>
      </Link>
    </section>
  );
}
