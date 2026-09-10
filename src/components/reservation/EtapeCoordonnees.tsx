"use client";

import { useState } from "react";
import { depuisCleDate, prestationParId, store } from "@/lib/reservation";
import type { Reservation } from "@/lib/reservation";

type Props = {
  prestationIds: readonly string[];
  dureeMinutes: number;
  dateCle: string;
  heure: string;
  onRetour: () => void;
  onConfirmee: (reservation: Reservation) => void;
};

/** 8 chiffres, avec ou sans indicatif +216 et espaces. */
function telephoneValide(valeur: string): boolean {
  const chiffres = valeur.replace(/[\s.-]/g, "").replace(/^\+?216/, "");
  return /^\d{8}$/.test(chiffres);
}

export function formatDateLongue(dateCle: string): string {
  return depuisCleDate(dateCle).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatDuree(minutes: number): string {
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  if (heures === 0) return `${reste} min`;
  return reste === 0 ? `${heures} h` : `${heures} h ${reste}`;
}

export default function EtapeCoordonnees({
  prestationIds,
  dureeMinutes,
  dateCle,
  heure,
  onRetour,
  onConfirmee,
}: Props) {
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [note, setNote] = useState("");
  const [erreurs, setErreurs] = useState<{ nom?: string; telephone?: string }>({});
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(evenement: React.FormEvent) {
    evenement.preventDefault();

    const nouvellesErreurs: typeof erreurs = {};
    if (nom.trim().length < 2) nouvellesErreurs.nom = "Indiquez votre nom.";
    if (!telephoneValide(telephone))
      nouvellesErreurs.telephone = "Numéro à 8 chiffres, ex. 54 395 168.";

    setErreurs(nouvellesErreurs);
    if (Object.keys(nouvellesErreurs).length > 0) return;

    setEnvoi(true);
    const reservation = await store.creer({
      prestationIds: [...prestationIds],
      date: dateCle,
      heure,
      nom: nom.trim(),
      telephone: telephone.trim(),
      note: note.trim() || undefined,
    });
    onConfirmee(reservation);
  }

  // `text-base` (16 px) n'est pas décoratif : en dessous de 16 px, Safari iOS
  // zoome sur le champ à la mise au point et ne dézoome jamais ensuite.
  // `scroll-mt-28` garde le champ visible sous l'en-tête collant quand le
  // clavier le fait défiler.
  const champ =
    "mt-1.5 w-full scroll-mt-28 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-base text-cream placeholder:text-white/25 focus:border-gold focus:outline-none";

  return (
    <section aria-labelledby="titre-coordonnees">
      <h2 id="titre-coordonnees" className="font-serif text-2xl font-light text-cream">
        Vos coordonnées
      </h2>

      <dl className="mt-5 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3.5 text-sm">
        {prestationIds.map((id, index) => {
          const prestation = prestationParId(id);
          if (!prestation) return null;
          return (
            <div key={id} className={`flex justify-between gap-4 ${index > 0 ? "mt-2" : ""}`}>
              <dt className="font-light text-white/50">
                {index === 0 ? (prestationIds.length > 1 ? "Prestations" : "Prestation") : ""}
              </dt>
              <dd className="text-right text-cream">{prestation.nom}</dd>
            </div>
          );
        })}
        <div className="mt-2 flex justify-between gap-4 border-t border-white/10 pt-2">
          <dt className="font-light text-white/50">Rendez-vous</dt>
          <dd className="text-right text-cream">
            {formatDateLongue(dateCle)} à {heure}
          </dd>
        </div>
        <div className="mt-2 flex justify-between gap-4">
          <dt className="font-light text-white/50">Durée totale</dt>
          <dd className="text-right text-cream">{formatDuree(dureeMinutes)}</dd>
        </div>
      </dl>

      <form onSubmit={soumettre} noValidate className="mt-6">
        <label className="block text-sm">
          <span className="font-light text-white/60">Nom</span>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            autoComplete="name"
            autoCapitalize="words"
            placeholder="Votre nom"
            aria-invalid={Boolean(erreurs.nom)}
            className={champ}
          />
          {erreurs.nom && <span className="mt-1 block text-xs text-red-300">{erreurs.nom}</span>}
        </label>

        <label className="mt-4 block text-sm">
          <span className="font-light text-white/60">Téléphone</span>
          <input
            type="tel"
            inputMode="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            autoComplete="tel"
            autoCorrect="off"
            placeholder="54 395 168"
            aria-invalid={Boolean(erreurs.telephone)}
            className={champ}
          />
          {erreurs.telephone && (
            <span className="mt-1 block text-xs text-red-300">{erreurs.telephone}</span>
          )}
        </label>

        <label className="mt-4 block text-sm">
          <span className="font-light text-white/60">Précision (facultatif)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Une préférence, une question…"
            className={`${champ} resize-none`}
          />
        </label>

        <div className="mt-7 flex gap-3">
          <button
            type="button"
            onClick={onRetour}
            className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/70"
          >
            Retour
          </button>
          <button
            type="submit"
            disabled={envoi}
            className="gold-gradient flex-1 rounded-full py-3 font-serif text-base text-noir disabled:opacity-50"
          >
            {envoi ? "Confirmation…" : "Confirmer"}
          </button>
        </div>
      </form>
    </section>
  );
}
