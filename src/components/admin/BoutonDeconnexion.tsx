"use client";

import { useTransition } from "react";
import { deconnexion } from "@/app/actions/auth";

export default function BoutonDeconnexion() {
  const [enCours, demarrer] = useTransition();

  return (
    <button
      type="button"
      disabled={enCours}
      onClick={() => demarrer(deconnexion)}
      className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-light text-white/60"
    >
      {enCours ? "…" : "Déconnexion"}
    </button>
  );
}
