"use client";

import { useActionState } from "react";
import { connexion, type EtatConnexion } from "@/app/actions/auth";
import { boutonOr, champSombre } from "@/components/ui/champs";

export default function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(connexion, null);

  return (
    <form action={action} className="mt-8">
      <label className="block text-sm">
        <span className="font-light text-white/60">E-mail</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="off"
          required
          className={champSombre}
        />
      </label>

      <label className="mt-4 block text-sm">
        <span className="font-light text-white/60">Mot de passe</span>
        <input
          name="motDePasse"
          type="password"
          autoComplete="current-password"
          required
          className={champSombre}
        />
      </label>

      {etat?.message && (
        <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {etat.message}
        </p>
      )}

      <button type="submit" disabled={enCours} className={`${boutonOr} mt-6 w-full`}>
        {enCours ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
