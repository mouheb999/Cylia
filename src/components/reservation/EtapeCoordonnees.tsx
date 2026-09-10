"use client";

import { useState } from "react";
import { boutonFantome, boutonOr, champSombre } from "@/components/ui/champs";
import { formatDateLongue, formatDuree } from "@/lib/format";

type Props = {
  prestationsNom: string[];
  dureeMinutes: number;
  dateCle: string;
  heure: string;
  erreur: string | null;
  envoi: boolean;
  onRetour: () => void;
  onValider: (donnees: { nom: string; telephone: string; note: string }) => void;
};

/** 8 chiffres, avec ou sans indicatif +216 et espaces. */
function telephoneValide(valeur: string): boolean {
  const chiffres = valeur.replace(/[\s.-]/g, "").replace(/^\+?216/, "");
  return /^\d{8}$/.test(chiffres);
}

export default function EtapeCoordonnees({
  prestationsNom,
  dureeMinutes,
  dateCle,
  heure,
  erreur,
  envoi,
  onRetour,
  onValider,
}: Props) {
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [note, setNote] = useState("");
  const [erreurs, setErreurs] = useState<{ nom?: string; telephone?: string }>({});

  function soumettre(evenement: React.FormEvent) {
    evenement.preventDefault();

    const nouvelles: typeof erreurs = {};
    if (nom.trim().length < 2) nouvelles.nom = "Indiquez votre nom.";
    if (!telephoneValide(telephone))
      nouvelles.telephone = "Numéro à 8 chiffres, ex. 54 395 168.";

    setErreurs(nouvelles);
    if (Object.keys(nouvelles).length > 0) return;

    onValider({ nom: nom.trim(), telephone: telephone.trim(), note: note.trim() });
  }

  return (
    <section aria-labelledby="titre-coordonnees">
      <h2 id="titre-coordonnees" className="font-serif text-2xl font-light text-cream">
        Vos coordonnées
      </h2>

      <dl className="mt-5 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3.5 text-sm">
        {prestationsNom.map((nomPrestation, index) => (
          <div key={nomPrestation} className={`flex justify-between gap-4 ${index > 0 ? "mt-2" : ""}`}>
            <dt className="font-light text-white/50">
              {index === 0 ? (prestationsNom.length > 1 ? "Prestations" : "Prestation") : ""}
            </dt>
            <dd className="text-right text-cream">{nomPrestation}</dd>
          </div>
        ))}
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
            className={champSombre}
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
            className={champSombre}
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
            className={`${champSombre} resize-none`}
          />
        </label>

        {erreur && (
          <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {erreur}
          </p>
        )}

        <div className="mt-7 flex gap-3">
          <button type="button" onClick={onRetour} className={boutonFantome}>
            Retour
          </button>
          <button type="submit" disabled={envoi} className={`${boutonOr} flex-1`}>
            {envoi ? "Confirmation…" : "Confirmer"}
          </button>
        </div>
      </form>
    </section>
  );
}
