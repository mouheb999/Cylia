import Image from "next/image";
import { site } from "@/lib/site";
import {
  IconClock,
  IconInstagram,
  IconPhone,
  IconPin,
  IconWhatsApp,
} from "./Icons";

export default function Footer() {
  return (
    <footer id="contact" className="bg-noir px-6 pb-10 pt-10 text-center">
      <Image
        src="/logo.png"
        alt="CYLIA Maison de Beauté"
        width={512}
        height={512}
        className="mx-auto h-20 w-20"
      />

      <div className="gold-rule mx-auto mt-6 h-px w-20" aria-hidden="true" />

      <address className="mt-6 not-italic">
        <p className="flex items-start justify-center gap-2 text-[0.9rem] font-light leading-relaxed text-white/75">
          <IconPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <span>
            {site.adresse.ligne1}
            <br />
            {site.adresse.ligne2}
          </span>
        </p>

        <p className="mt-4 flex items-center justify-center gap-2 text-[0.9rem] font-light text-white/75">
          <IconClock className="h-4 w-4 shrink-0 text-gold" />
          {site.horaires}
        </p>

        <p className="mt-4">
          <a
            href={`tel:${site.telephoneLien}`}
            className="inline-flex items-center gap-2 font-serif text-xl tracking-wide text-gold"
          >
            <IconPhone className="h-4 w-4" />
            {site.telephone}
          </a>
        </p>
      </address>

      <a
        href={site.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="gold-gradient mx-auto mt-8 flex w-full max-w-[20rem] items-center justify-center gap-2.5 rounded-full py-4 font-serif text-lg text-noir"
      >
        <IconWhatsApp className="h-5 w-5" />
        Réserver sur WhatsApp
      </a>

      <a
        href={site.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 text-xs font-light uppercase tracking-[0.2em] text-white/55"
      >
        <IconInstagram className="h-4 w-4 text-gold" />
        cyliamaisondebeaute
      </a>

      <p className="mt-8 text-[0.7rem] font-light tracking-wide text-white/35">
        © {new Date().getFullYear()} {site.nom}
      </p>
    </footer>
  );
}
