"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ajouterFermeture,
  enregistrerReglages,
  supprimerFermeture,
} from "@/app/actions/admin";
import { boutonOr, champSombre } from "@/components/ui/champs";
import { formatDateCourte, heureVersMinutes, minutesVersHeure } from "@/lib/format";
import type { Fermeture, Reglages } from "@/lib/supabase/types";

function nombreOuNull(valeur: string): number | null {
  const propre = valeur.trim().replace(",", ".");
  if (propre === "") return null;
  const nombre = Number(propre);
  return Number.isFinite(nombre) ? nombre : null;
}

export default function GestionReglages({
  reglages,
  fermetures,
}: {
  reglages: Reglages;
  fermetures: Fermeture[];
}) {
  const router = useRouter();
  const [ouverture, setOuverture] = useState(minutesVersHeure(reglages.ouverture_minutes));
  const [fermeture, setFermeture] = useState(minutesVersHeure(reglages.fermeture_minutes));
  const [pas, setPas] = useState(String(reglages.pas_minutes));
  const [capacite, setCapacite] = useState(String(reglages.capacite_simultanee));
  const [delai, setDelai] = useState(String(reglages.delai_minimum_minutes));
  const [jours, setJours] = useState(String(reglages.jours_proposes));
  const [devise, setDevise] = useState(reglages.devise);
  const [frais, setFrais] = useState(String(reglages.frais_livraison));
  const [gratuite, setGratuite] = useState(
    reglages.livraison_gratuite_des != null ? String(reglages.livraison_gratuite_des) : "",
  );
  const [reservationActive, setReservationActive] = useState(reglages.reservation_active);
  const [boutiqueActive, setBoutiqueActive] = useState(reglages.boutique_active);

  const [debutFermeture, setDebutFermeture] = useState("");
  const [finFermeture, setFinFermeture] = useState("");
  const [motif, setMotif] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function enregistrer() {
    const debut = heureVersMinutes(ouverture);
    const fin = heureVersMinutes(fermeture);
    if (!Number.isFinite(debut) || !Number.isFinite(fin) || fin <= debut) {
      return setErreur("L'heure de fermeture doit suivre l'heure d'ouverture.");
    }

    setErreur(null);
    setMessage(null);
    demarrer(async () => {
      const reponse = await enregistrerReglages({
        ouverture_minutes: debut,
        fermeture_minutes: fin,
        pas_minutes: Math.max(5, Number(nombreOuNull(pas) ?? 30)),
        capacite_simultanee: Math.max(1, Number(nombreOuNull(capacite) ?? 1)),
        delai_minimum_minutes: Math.max(0, Number(nombreOuNull(delai) ?? 0)),
        jours_proposes: Math.min(60, Math.max(1, Number(nombreOuNull(jours) ?? 14))),
        devise: devise.trim() || "DT",
        frais_livraison: Math.max(0, Number(nombreOuNull(frais) ?? 0)),
        livraison_gratuite_des: nombreOuNull(gratuite),
        reservation_active: reservationActive,
        boutique_active: boutiqueActive,
      });
      if (!reponse.ok) return setErreur(reponse.message);
      setMessage("Réglages enregistrés.");
      router.refresh();
    });
  }

  function ajouter() {
    if (!debutFermeture) return setErreur("Choisissez une date de début.");
    setErreur(null);
    demarrer(async () => {
      const reponse = await ajouterFermeture(debutFermeture, finFermeture, motif);
      if (!reponse.ok) return setErreur(reponse.message);
      setDebutFermeture("");
      setFinFermeture("");
      setMotif("");
      router.refresh();
    });
  }

  function retirer(id: string) {
    demarrer(async () => {
      const reponse = await supprimerFermeture(id);
      if (!reponse.ok) return setErreur(reponse.message);
      router.refresh();
    });
  }

  return (
    <div className="mt-6">
      {erreur && (
        <p role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {erreur}
        </p>
      )}
      {message && (
        <p className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      )}

      <section>
        <h2 className="font-serif text-lg font-light text-gold">Horaires & planning</h2>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="font-light text-white/60">Ouverture</span>
            <input type="time" value={ouverture} onChange={(e) => setOuverture(e.target.value)} className={champSombre} />
          </label>
          <label className="block text-sm">
            <span className="font-light text-white/60">Fermeture</span>
            <input type="time" value={fermeture} onChange={(e) => setFermeture(e.target.value)} className={champSombre} />
          </label>
          <label className="block text-sm">
            <span className="font-light text-white/60">Pas des créneaux (min)</span>
            <input inputMode="numeric" value={pas} onChange={(e) => setPas(e.target.value)} className={champSombre} />
          </label>
          <label className="block text-sm">
            <span className="font-light text-white/60">Rendez-vous en même temps</span>
            <input inputMode="numeric" value={capacite} onChange={(e) => setCapacite(e.target.value)} className={champSombre} />
          </label>
          <label className="block text-sm">
            <span className="font-light text-white/60">Délai minimum (min)</span>
            <input inputMode="numeric" value={delai} onChange={(e) => setDelai(e.target.value)} className={champSombre} />
          </label>
          <label className="block text-sm">
            <span className="font-light text-white/60">Jours proposés</span>
            <input inputMode="numeric" value={jours} onChange={(e) => setJours(e.target.value)} className={champSombre} />
          </label>
        </div>

        <p className="mt-2 text-xs font-light leading-relaxed text-white/40">
          « Rendez-vous en même temps » est le nombre de postes ou de cabines&nbsp;:
          un créneau n&apos;est refusé que lorsque toutes les places sont prises.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-lg font-light text-gold">Boutique</h2>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="font-light text-white/60">Devise</span>
            <input value={devise} onChange={(e) => setDevise(e.target.value)} className={champSombre} />
          </label>
          <label className="block text-sm">
            <span className="font-light text-white/60">Frais de livraison</span>
            <input inputMode="decimal" value={frais} onChange={(e) => setFrais(e.target.value)} className={champSombre} />
          </label>
          <label className="col-span-2 block text-sm">
            <span className="font-light text-white/60">Livraison offerte à partir de (vide = jamais)</span>
            <input inputMode="decimal" value={gratuite} onChange={(e) => setGratuite(e.target.value)} className={champSombre} />
          </label>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-serif text-lg font-light text-gold">Ouverture des services</h2>

        <label className="flex items-center gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={reservationActive}
            onChange={(e) => setReservationActive(e.target.checked)}
            className="h-5 w-5 accent-[#d5b17c]"
          />
          Réservation en ligne ouverte
        </label>
        <label className="flex items-center gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={boutiqueActive}
            onChange={(e) => setBoutiqueActive(e.target.checked)}
            className="h-5 w-5 accent-[#d5b17c]"
          />
          Boutique ouverte
        </label>
      </section>

      <button type="button" disabled={enCours} onClick={enregistrer} className={`${boutonOr} mt-6 w-full`}>
        {enCours ? "Enregistrement…" : "Enregistrer les réglages"}
      </button>

      <section className="mt-10">
        <h2 className="font-serif text-lg font-light text-gold">Jours de fermeture</h2>
        <p className="mt-1 text-xs font-light leading-relaxed text-white/40">
          Congés, fériés, absences&nbsp;: aucune réservation n&apos;est possible sur
          ces dates.
        </p>

        {fermetures.length > 0 && (
          <ul className="mt-3 space-y-2">
            {fermetures.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <span className="min-w-0 text-sm text-cream">
                  {formatDateCourte(f.date_debut)}
                  {f.date_fin !== f.date_debut && ` → ${formatDateCourte(f.date_fin)}`}
                  {f.motif && (
                    <span className="mt-0.5 block truncate text-xs font-light text-white/45">
                      {f.motif}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  disabled={enCours}
                  onClick={() => retirer(f.id)}
                  className="shrink-0 rounded-full border border-red-400/30 px-3 py-1.5 text-xs text-red-300"
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="font-light text-white/60">Du</span>
            <input
              type="date"
              value={debutFermeture}
              onChange={(e) => setDebutFermeture(e.target.value)}
              className={champSombre}
            />
          </label>
          <label className="block text-sm">
            <span className="font-light text-white/60">Au (facultatif)</span>
            <input
              type="date"
              value={finFermeture}
              onChange={(e) => setFinFermeture(e.target.value)}
              className={champSombre}
            />
          </label>
        </div>

        <label className="mt-3 block text-sm">
          <span className="font-light text-white/60">Motif (facultatif)</span>
          <input value={motif} onChange={(e) => setMotif(e.target.value)} className={champSombre} />
        </label>

        <button
          type="button"
          disabled={enCours}
          onClick={ajouter}
          className="mt-3 w-full rounded-full border border-gold/35 py-3 text-sm text-gold disabled:opacity-40"
        >
          Ajouter une fermeture
        </button>
      </section>
    </div>
  );
}
