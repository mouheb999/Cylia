"use client";

import Link from "next/link";
import { prestationParId } from "@/lib/reservation";
import type { Reservation } from "@/lib/reservation";
import { site } from "@/lib/site";
import { IconWhatsApp } from "@/components/Icons";
import { formatDateLongue } from "./EtapeCoordonnees";

type Props = {
  reservation: Reservation;
  onRecommencer: () => void;
};

export default function Confirmation({ reservation, onRecommencer }: Props) {
  const prestation = prestationParId(reservation.prestationId);
  const recapitulatif = [
    `Bonjour, je viens de réserver sur votre site :`,
    `${prestation?.nom ?? "Prestation"}`,
    `${formatDateLongue(reservation.date)} à ${reservation.heure}`,
    `Au nom de ${reservation.nom} (${reservation.telephone})`,
    `Référence ${reservation.reference}`,
  ].join("\n");

  return (
    <div className="px-5 pb-16 text-center">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/40"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-gold" fill="none" stroke="currentColor" strokeWidth={1.2}>
          <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 className="mt-5 font-serif text-2xl font-light text-cream">
        Votre rendez-vous
        <span className="mt-0.5 block font-script text-3xl text-gold">est noté</span>
      </h2>

      <dl className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5 text-left text-sm">
        <div className="flex justify-between gap-4">
          <dt className="font-light text-white/50">Prestation</dt>
          <dd className="text-right text-cream">{prestation?.nom}</dd>
        </div>
        <div className="mt-2.5 flex justify-between gap-4">
          <dt className="font-light text-white/50">Rendez-vous</dt>
          <dd className="text-right text-cream">
            {formatDateLongue(reservation.date)} à {reservation.heure}
          </dd>
        </div>
        <div className="mt-2.5 flex justify-between gap-4">
          <dt className="font-light text-white/50">Au nom de</dt>
          <dd className="text-right text-cream">{reservation.nom}</dd>
        </div>
        <div className="mt-2.5 flex justify-between gap-4 border-t border-white/8 pt-2.5">
          <dt className="font-light text-white/50">Référence</dt>
          <dd className="text-right font-serif tracking-wider text-gold lining-nums">{reservation.reference}</dd>
        </div>
      </dl>

      <p className="mt-5 text-[0.8rem] font-light leading-relaxed text-white/50">
        Envoyez le récapitulatif au salon pour que votre créneau soit confirmé.
      </p>

      <a
        href={`${site.whatsapp}?text=${encodeURIComponent(recapitulatif)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="gold-gradient mt-4 flex w-full items-center justify-center gap-2.5 rounded-full py-4 font-serif text-lg text-noir"
      >
        <IconWhatsApp className="h-5 w-5" />
        Envoyer au salon
      </a>

      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={onRecommencer}
          className="rounded-full border border-white/15 py-3 text-sm text-white/70"
        >
          Prendre un autre rendez-vous
        </button>
        <Link href="/" className="py-1 text-sm font-light text-white/45">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
