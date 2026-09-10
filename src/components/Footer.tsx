import Image from "next/image";
import logo from "@/images/logo.png";
import Link from "next/link";
import { carteIntegree, lienItineraire, lienMaps, site } from "@/lib/site";
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
        src={logo}
        alt="CYLIA Maison de Beauté"
        className="mx-auto h-20 w-20"
      />

      <div className="gold-rule mx-auto mt-6 h-px w-20" aria-hidden="true" />

      <address className="mt-6 not-italic">
        <a
          href={lienMaps}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start justify-center gap-2 text-[0.9rem] font-light leading-relaxed text-white/75"
        >
          <IconPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <span>
            {site.adresse.ligne1}
            <br />
            {site.adresse.ligne2}
          </span>
        </a>

        <p className="mt-4 flex items-center justify-center gap-2 text-[0.9rem] font-light text-white/75">
          <IconClock className="h-4 w-4 shrink-0 text-gold" />
          {site.horaires}
        </p>

        <p className="mt-4">
          <a
            href={`tel:${site.telephoneLien}`}
            className="inline-flex items-center gap-2 font-serif text-xl tracking-wide text-gold lining-nums"
          >
            <IconPhone className="h-4 w-4" />
            {site.telephone}
          </a>
        </p>
      </address>

      <Link
        href="/reserver"
        className="gold-gradient mx-auto mt-8 flex w-full max-w-[20rem] items-center justify-center rounded-full py-4 font-serif text-lg text-noir"
      >
        Réserver en ligne
      </Link>

      <a
        href={site.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-auto mt-3 flex w-full max-w-[20rem] items-center justify-center gap-2.5 rounded-full border border-gold/35 py-3.5 font-serif text-base text-gold"
      >
        <IconWhatsApp className="h-5 w-5" />
        Écrire sur WhatsApp
      </a>

      {/* Le fond sombre évite un rectangle clair si la carte tarde ou si le
          réseau de la visiteuse bloque Google. L'itinéraire juste en dessous
          reste alors le chemin utile. */}
      <div className="mx-auto mt-9 max-w-[22rem] overflow-hidden rounded-2xl border border-white/10 bg-noir-soft">
        <iframe
          src={carteIntegree}
          title={`Emplacement de ${site.nom} sur Google Maps`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-[180px] w-full border-0"
        />
      </div>

      <a
        href={lienItineraire}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-auto mt-3 flex w-full max-w-[22rem] items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-sm font-light text-white/75"
      >
        <IconPin className="h-4 w-4 text-gold" />
        Itinéraire
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
