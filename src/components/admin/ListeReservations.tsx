"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changerStatutReservation } from "@/app/actions/admin";
import { IconPhone, IconWhatsApp } from "@/components/Icons";
import {
  formatDateLongue,
  formatDepuis,
  formatDuree,
  formatPrix,
  minutesVersHeure,
} from "@/lib/format";
import { useMinute } from "@/lib/horloge";
import { gesteParDefaut, messageWhatsApp } from "@/lib/messages-reservation";
import { lienAppel, lienWhatsApp } from "@/lib/telephone";
import type { Reservation, StatutReservation } from "@/lib/supabase/types";

const LIBELLES: Record<StatutReservation, string> = {
  en_attente: "À confirmer",
  confirmee: "Confirmé",
  terminee: "Terminé",
  annulee: "Annulé",
};

const COULEURS: Record<StatutReservation, string> = {
  en_attente: "border-gold/40 text-gold",
  confirmee: "border-emerald-400/40 text-emerald-300",
  terminee: "border-white/20 text-white/50",
  annulee: "border-red-400/30 text-red-300",
};

/** Ce que le salon peut faire ensuite, selon l'état du rendez-vous. */
const SUITES: Record<StatutReservation, StatutReservation[]> = {
  en_attente: ["confirmee", "annulee"],
  confirmee: ["terminee", "annulee"],
  terminee: ["confirmee"],
  annulee: ["en_attente"],
};

/**
 * Le libellé dépend d'où l'on part.
 *
 * « Annuler » une demande qui n'a jamais été confirmée n'a pas de sens : on la
 * **refuse**. Le même bouton sur un rendez-vous confirmé annule, lui, un
 * engagement pris — et la nuance compte pour qui appuie.
 */
function libelleSuite(depuis: StatutReservation, vers: StatutReservation): string {
  if (vers === "annulee") return depuis === "en_attente" ? "Refuser" : "Annuler";
  if (vers === "confirmee") return depuis === "terminee" ? "Rouvrir" : "Confirmer";
  if (vers === "terminee") return "Marquer terminé";
  return "Rouvrir";
}

export default function ListeReservations({
  reservations,
  devise,
  aujourdhui,
}: {
  reservations: Reservation[];
  devise: string;
  /** Date du jour à l'heure du salon, calculée côté serveur. */
  aujourdhui: string;
}) {
  const router = useRouter();
  const [, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  /*
   * Le statut bascule à l'écran avant que le serveur ait répondu.
   *
   * Le salon confirme dix rendez-vous d'affilée, souvent en 4G : attendre
   * l'aller-retour à chaque clic, c'est dix attentes. En cas de refus, React
   * remet l'ancien statut de lui-même et le message dit pourquoi.
   */
  const [affichees, prevoir] = useOptimistic(
    reservations,
    (liste: Reservation[], maj: { id: string; statut: StatutReservation }) =>
      liste.map((r) => (r.id === maj.id ? { ...r, statut: maj.statut } : r)),
  );

  function changer(id: string, statut: StatutReservation) {
    setErreur(null);
    demarrer(async () => {
      prevoir({ id, statut });
      const reponse = await changerStatutReservation(id, statut);
      if (!reponse.ok) setErreur(reponse.message);
      else router.refresh();
    });
  }

  if (reservations.length === 0) {
    return (
      <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm font-light text-white/45">
        Aucun rendez-vous dans cette vue.
      </p>
    );
  }

  // Regroupé par jour : c'est ainsi qu'on lit un planning.
  const parJour = new Map<string, Reservation[]>();
  for (const r of affichees) {
    const liste = parJour.get(r.date) ?? [];
    liste.push(r);
    parJour.set(r.date, liste);
  }

  return (
    <div className="mt-5">
      {erreur && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {erreur}
        </p>
      )}

      {[...parJour.entries()].map(([date, duJour]) => (
        <section key={date} className="mb-7">
          <h2 className="font-serif text-lg font-light capitalize text-gold">
            {formatDateLongue(date)}
          </h2>

          <ul className="mt-3 space-y-3">
            {duJour.map((r) => (
              <CarteReservation
                key={r.id}
                reservation={r}
                devise={devise}
                enRetard={r.statut === "en_attente" && r.date < aujourdhui}
                onChanger={changer}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function CarteReservation({
  reservation: r,
  devise,
  enRetard,
  onChanger,
}: {
  reservation: Reservation;
  devise: string;
  enRetard: boolean;
  onChanger: (id: string, statut: StatutReservation) => void;
}) {
  // `null` au rendu serveur, l'heure réelle une fois monté : voir `lib/horloge`.
  const maintenant = useMinute();

  const whatsapp = lienWhatsApp(r.telephone, messageWhatsApp(gesteParDefaut(r.statut), r));

  return (
    <li
      className={`rounded-2xl border p-4 ${
        enRetard
          ? "border-red-400/35 bg-red-500/[0.06]"
          : r.statut === "en_attente"
            ? "border-gold/30 bg-gold/[0.05]"
            : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-lg text-cream lining-nums">
            {minutesVersHeure(r.heure_minutes)}
            <span className="ml-2 text-xs font-light text-white/40">
              {formatDuree(r.duree_minutes)}
            </span>
          </p>
          <p className="mt-1 text-sm text-cream">{r.nom}</p>
          <p className="text-sm text-gold lining-nums">{r.telephone}</p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.65rem] ${COULEURS[r.statut]}`}
        >
          {LIBELLES[r.statut]}
        </span>
      </div>

      <p className="mt-2 text-xs font-light leading-relaxed text-white/50">
        {r.prestations_nom.join(" · ")}
        {r.prix_total != null ? (
          ` — ${formatPrix(r.prix_total, devise)}`
        ) : (
          <span className="text-white/35"> — prix à confirmer</span>
        )}
      </p>

      {r.note && (
        <p className="mt-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-xs font-light leading-relaxed text-white/55">
          « {r.note} »
        </p>
      )}

      <p className="mt-2 text-[0.65rem] font-light text-white/30 lining-nums">
        Réf. {r.reference}
        {maintenant !== null && ` · demandé ${formatDepuis(r.cree_le, maintenant)}`}
      </p>

      {enRetard && (
        <p className="mt-2 text-[0.7rem] font-light text-red-300">
          Ce rendez-vous est passé sans jamais avoir été traité.
        </p>
      )}

      {/* Joindre d'abord, décider ensuite : c'est l'ordre réel du geste. */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="press flex items-center justify-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-2.5 text-xs text-emerald-200"
          >
            <IconWhatsApp className="h-4 w-4" />
            WhatsApp
          </a>
        ) : (
          <span className="rounded-full border border-white/10 px-3 py-2.5 text-center text-xs text-white/25">
            Numéro illisible
          </span>
        )}

        <a
          href={lienAppel(r.telephone)}
          className="press flex items-center justify-center gap-2 rounded-full border border-white/20 px-3 py-2.5 text-xs text-cream"
        >
          <IconPhone className="h-4 w-4" />
          Appeler
        </a>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {SUITES[r.statut].map((suite) => (
          <button
            key={suite}
            type="button"
            onClick={() => onChanger(r.id, suite)}
            className={`press flex-1 rounded-full border px-3.5 py-2.5 text-xs ${
              suite === "annulee"
                ? "border-red-400/30 text-red-300"
                : suite === "confirmee" && r.statut === "en_attente"
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-gold/35 text-gold"
            }`}
          >
            {libelleSuite(r.statut, suite)}
          </button>
        ))}
      </div>
    </li>
  );
}
