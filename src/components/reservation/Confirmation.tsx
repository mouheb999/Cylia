"use client";

import Link from "next/link";
import { MODE_DEMO, dureeTotale, prestationParId } from "@/lib/reservation";
import type { Reservation } from "@/lib/reservation";
import { formatDateLongue, formatDuree } from "./EtapeCoordonnees";

type Props = {
  reservation: Reservation;
  onRecommencer: () => void;
};

export default function Confirmation({ reservation, onRecommencer }: Props) {
  const prestations = reservation.prestationIds
    .map((id) => prestationParId(id))
    .filter((p) => p !== undefined);

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
        {prestations.map((prestation, index) => (
          <div
            key={prestation.id}
            className={`flex justify-between gap-4 ${index > 0 ? "mt-2.5" : ""}`}
          >
            <dt className="font-light text-white/50">
              {index === 0 ? (prestations.length > 1 ? "Prestations" : "Prestation") : ""}
            </dt>
            <dd className="text-right text-cream">{prestation.nom}</dd>
          </div>
        ))}
        <div className="mt-2.5 flex justify-between gap-4 border-t border-white/8 pt-2.5">
          <dt className="font-light text-white/50">Rendez-vous</dt>
          <dd className="text-right text-cream">
            {formatDateLongue(reservation.date)} à {reservation.heure}
          </dd>
        </div>
        <div className="mt-2.5 flex justify-between gap-4">
          <dt className="font-light text-white/50">Durée totale</dt>
          <dd className="text-right text-cream">
            {formatDuree(dureeTotale(reservation.prestationIds))}
          </dd>
        </div>
        <div className="mt-2.5 flex justify-between gap-4">
          <dt className="font-light text-white/50">Au nom de</dt>
          <dd className="text-right text-cream">{reservation.nom}</dd>
        </div>
        <div className="mt-2.5 flex justify-between gap-4 border-t border-white/8 pt-2.5">
          <dt className="font-light text-white/50">Référence</dt>
          <dd className="text-right font-serif tracking-wider text-gold lining-nums">
            {reservation.reference}
          </dd>
        </div>
      </dl>

      <p className="mt-5 text-[0.8rem] font-light leading-relaxed text-white/50">
        Conservez votre référence&nbsp;: elle nous permet de retrouver votre
        rendez-vous.
      </p>

      <div className="mt-7 flex flex-col gap-3">
        <button
          type="button"
          onClick={onRecommencer}
          className="gold-gradient rounded-full py-3.5 font-serif text-base text-noir"
        >
          Prendre un autre rendez-vous
        </button>
        <Link href="/" className="py-2 text-sm font-light text-white/50">
          Retour à l&apos;accueil
        </Link>
      </div>

      {MODE_DEMO && (
        <p className="mt-10 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-center text-[0.7rem] font-light leading-relaxed text-white/40">
          Démonstration — la réservation reste sur cet appareil, le salon n&apos;en
          est pas encore averti.
        </p>
      )}
    </div>
  );
}
