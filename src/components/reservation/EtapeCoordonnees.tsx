"use client";

import { useState } from "react";
import { IconWhatsApp } from "@/components/Icons";
import LienSuivi from "@/components/LienSuivi";
import { boutonFantome, boutonOr, champSombre } from "@/components/ui/champs";
import { formatDateLongue, formatDuree, formatPrix } from "@/lib/format";
import { MESSAGE_MOBILE_INVALIDE, mobileTunisienValide } from "@/lib/telephone";

/** Le WhatsApp du salon — le même que celui de la boutique. */
const NUMERO_WHATSAPP = "21651395169";

type Props = {
  /** Chaque prestation retenue, avec son tarif du jour. */
  lignes: { id: string; nom: string; prix: number | null; aPartirDe: boolean }[];
  /**
   * Le total annoncé : le prix du pack quand il est complet (`libelle` porte
   * alors son nom), sinon la somme des prestations. `montant: null` : au
   * moins un prix n'est pas connu, le salon le précisera.
   */
  total: { libelle: string | null; montant: number | null; aPartirDe: boolean };
  devise: string;
  dureeMinutes: number;
  dateCle: string;
  heure: string;
  erreur: string | null;
  envoi: boolean;
  onRetour: () => void;
  onValider: (donnees: { nom: string; telephone: string; note: string }) => void;
};

type Champ = "nom" | "telephone";

function erreurDe(champ: Champ, valeur: string): string | undefined {
  if (champ === "nom") return valeur.trim().length < 2 ? "Indiquez votre nom." : undefined;
  if (!valeur.trim()) return "Indiquez votre numéro de téléphone.";
  return mobileTunisienValide(valeur) ? undefined : MESSAGE_MOBILE_INVALIDE;
}

export default function EtapeCoordonnees({
  lignes,
  total,
  devise,
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
  const [erreurs, setErreurs] = useState<Partial<Record<Champ, string>>>({});

  const valeurs: Record<Champ, string> = { nom, telephone };

  /** À la sortie d'un champ rempli : on le juge. */
  function verifier(champ: Champ, valeur = valeurs[champ]) {
    setErreurs((avant) => ({ ...avant, [champ]: erreurDe(champ, valeur) }));
  }

  /** Pendant la saisie : une erreur affichée s'efface dès que c'est corrigé. */
  function corriger(champ: Champ, valeur: string) {
    if (erreurs[champ]) verifier(champ, valeur);
  }

  function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();

    const nouvelles: Partial<Record<Champ, string>> = {};
    for (const champ of ["nom", "telephone"] as const) {
      const message = erreurDe(champ, valeurs[champ]);
      if (message) nouvelles[champ] = message;
    }
    setErreurs(nouvelles);
    const premier = (["nom", "telephone"] as const).find((c) => nouvelles[c]);
    if (premier) {
      evenement.currentTarget.querySelector<HTMLElement>(`[name="${premier}"]`)?.focus();
      return;
    }

    onValider({ nom: nom.trim(), telephone: telephone.trim(), note: note.trim() });
  }

  const prixLigne = (l: Props["lignes"][number]) =>
    l.prix === null ? "prix au salon" : `${l.aPartirDe ? "dès " : ""}${formatPrix(l.prix, devise)}`;
  const totalTexte =
    total.montant === null
      ? "à confirmer"
      : `${total.aPartirDe ? "à partir de " : ""}${formatPrix(total.montant, devise)}`;
  const quand = `${formatDateLongue(dateCle)} à ${heure}`;

  // La réservation par WhatsApp : la visite telle qu'elle est, et ce qui est
  // déjà rempli — le salon n'a plus qu'à confirmer.
  const messageWhatsApp = [
    "Bonjour CYLIA, je souhaite réserver :",
    ...lignes.map((l) => `• ${l.nom} — ${prixLigne(l)}`),
    ...(total.libelle ? [`(${total.libelle})`] : []),
    `Le ${quand} (${formatDuree(dureeMinutes)})`,
    `Total : ${totalTexte}`,
    ...(nom.trim() ? [`Nom : ${nom.trim()}`] : []),
    ...(telephone.trim() ? [`Téléphone : ${telephone.trim()}`] : []),
  ].join("\n");

  return (
    <section aria-labelledby="titre-coordonnees">
      <h2 id="titre-coordonnees" className="font-serif text-2xl font-light text-cream">
        Vos coordonnées
      </h2>

      <dl className="mt-5 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="font-light text-white/50">Rendez-vous</dt>
          <dd className="text-right text-cream">{quand}</dd>
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
            name="nom"
            type="text"
            value={nom}
            onChange={(e) => {
              setNom(e.target.value);
              corriger("nom", e.target.value);
            }}
            onBlur={() => nom && verifier("nom")}
            autoComplete="name"
            autoCapitalize="words"
            placeholder="Votre nom"
            required
            aria-invalid={Boolean(erreurs.nom)}
            aria-describedby={erreurs.nom ? "erreur-nom" : undefined}
            className={champSombre}
          />
          {erreurs.nom && (
            <span id="erreur-nom" className="mt-1 block text-xs text-red-300">
              {erreurs.nom}
            </span>
          )}
        </label>

        <label className="mt-4 block text-sm">
          <span className="font-light text-white/60">Téléphone</span>
          <input
            name="telephone"
            type="tel"
            inputMode="tel"
            value={telephone}
            onChange={(e) => {
              setTelephone(e.target.value);
              corriger("telephone", e.target.value);
            }}
            onBlur={() => telephone && verifier("telephone")}
            autoComplete="tel"
            autoCorrect="off"
            placeholder="54 395 168"
            required
            aria-invalid={Boolean(erreurs.telephone)}
            aria-describedby={erreurs.telephone ? "erreur-telephone" : undefined}
            className={champSombre}
          />
          {erreurs.telephone && (
            <span id="erreur-telephone" className="mt-1 block text-xs text-red-300">
              {erreurs.telephone}
            </span>
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

        {/*
          Juste au-dessus de « Confirmer » : ce que la cliente réserve, prix par
          prix, et ce qu'elle paiera au salon. Le dernier coup d'œil avant de
          s'engager tombe sur le total.
        */}
        <dl className="mt-6 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3.5 text-sm">
          {lignes.map((l) => (
            <div key={l.id} className="mt-2 flex justify-between gap-4 first:mt-0">
              <dt className="text-cream">{l.nom}</dt>
              <dd className="shrink-0 text-right text-white/70 lining-nums">{prixLigne(l)}</dd>
            </div>
          ))}
          {total.libelle && (
            <div className="mt-2 flex justify-between gap-4">
              <dt className="font-light text-white/50">Formule</dt>
              <dd className="text-right text-gold">{total.libelle}</dd>
            </div>
          )}
          <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-white/10 pt-3">
            <dt className="text-cream">
              Total{total.aPartirDe && total.montant !== null ? " à partir de" : ""}
            </dt>
            <dd className="text-right font-serif text-2xl font-semibold leading-none text-gold lining-nums">
              {total.montant === null ? "À confirmer" : formatPrix(total.montant, devise)}
            </dd>
          </div>
          <p className="mt-2 text-[0.7rem] font-light text-white/40">Paiement au salon.</p>
        </dl>

        {erreur && (
          <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {erreur}
          </p>
        )}

        <div className="mt-4 flex gap-3">
          <button type="button" onClick={onRetour} className={boutonFantome}>
            Retour
          </button>
          <button type="submit" disabled={envoi} className={`${boutonOr} flex-1`}>
            {envoi ? "Confirmation…" : "Confirmer"}
          </button>
        </div>

        <LienSuivi
          evenement="Contact"
          parametres={{ method: "whatsapp", content_name: "reservation" }}
          href={`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(messageWhatsApp)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-full border border-gold/35 py-3 font-serif text-base text-gold"
        >
          <IconWhatsApp className="h-4 w-4 shrink-0" />
          Réserver sur WhatsApp
        </LienSuivi>
      </form>
    </section>
  );
}
