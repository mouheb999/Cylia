import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import FluxReservationClient from "@/components/reservation/FluxReservationClient";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Réserver — CYLIA Maison de Beauté",
  description:
    "Choisissez votre prestation, votre date et votre créneau chez CYLIA Maison de Beauté, Sousse.",
};

export default function PageReservation() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-noir">
        <div className="px-5 pb-8 pt-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
            Prendre rendez-vous
          </p>
          <h1 className="mt-3 font-serif text-3xl font-light text-cream">
            Réservez votre
            <span className="mt-0.5 block font-script text-4xl text-gold">moment</span>
          </h1>
          <div className="gold-rule mx-auto mt-4 h-px w-16" aria-hidden="true" />
        </div>

        <FluxReservationClient />
      </main>

      <footer className="bg-noir px-6 pb-10 text-center">
        <p className="text-[0.75rem] font-light leading-relaxed text-white/40">
          Une question&nbsp;? Appelez le{" "}
          <a href={`tel:${site.telephoneLien}`} className="text-gold">
            {site.telephone}
          </a>
          <br />
          {site.horaires}
        </p>
        <Link href="/" className="mt-4 inline-block text-[0.75rem] font-light text-white/35">
          CYLIA Maison de Beauté
        </Link>
      </footer>
    </>
  );
}
