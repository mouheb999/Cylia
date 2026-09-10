"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changerStatutCommande } from "@/app/actions/admin";
import { formatHorodatage, formatPrix } from "@/lib/format";
import type { CommandeDetaillee } from "@/lib/donnees-admin";
import type { StatutCommande } from "@/lib/supabase/types";

const LIBELLES: Record<StatutCommande, string> = {
  en_attente: "À traiter",
  confirmee: "Confirmée",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

const COULEURS: Record<StatutCommande, string> = {
  en_attente: "border-gold/40 text-gold",
  confirmee: "border-sky-400/40 text-sky-300",
  expediee: "border-violet-400/40 text-violet-300",
  livree: "border-emerald-400/40 text-emerald-300",
  annulee: "border-red-400/30 text-red-300",
};

const SUITES: Record<StatutCommande, StatutCommande[]> = {
  en_attente: ["confirmee", "annulee"],
  confirmee: ["expediee", "annulee"],
  expediee: ["livree", "annulee"],
  livree: ["expediee"],
  annulee: ["en_attente"],
};

export default function ListeCommandes({
  commandes,
  devise,
}: {
  commandes: CommandeDetaillee[];
  devise: string;
}) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function changer(id: string, statut: StatutCommande) {
    setErreur(null);
    demarrer(async () => {
      const reponse = await changerStatutCommande(id, statut);
      if (!reponse.ok) setErreur(reponse.message);
      else router.refresh();
    });
  }

  if (commandes.length === 0) {
    return (
      <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm font-light text-white/45">
        Aucune commande dans cette vue.
      </p>
    );
  }

  return (
    <div className="mt-5">
      {erreur && (
        <p role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {erreur}
        </p>
      )}

      <ul className="space-y-3">
        {commandes.map((commande) => (
          <li key={commande.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-cream">{commande.nom}</p>
                <a href={`tel:${commande.telephone}`} className="text-sm text-gold lining-nums">
                  {commande.telephone}
                </a>
                <p className="mt-1 text-xs font-light leading-relaxed text-white/50">
                  {commande.adresse}
                  <br />
                  {commande.ville}
                  {commande.email && (
                    <>
                      <br />
                      {commande.email}
                    </>
                  )}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <span
                  className={`inline-block rounded-full border px-2.5 py-1 text-[0.65rem] ${COULEURS[commande.statut]}`}
                >
                  {LIBELLES[commande.statut]}
                </span>
                <p className="mt-2 font-serif text-lg text-gold lining-nums">
                  {formatPrix(commande.total, devise)}
                </p>
              </div>
            </div>

            <ul className="mt-3 border-t border-white/8 pt-3 text-xs font-light text-white/60">
              {commande.articles.map((article) => (
                <li key={article.id} className="flex justify-between gap-3 py-0.5">
                  <span>
                    {article.nom} × {article.quantite}
                  </span>
                  <span className="lining-nums">
                    {formatPrix(article.prix * article.quantite, devise)}
                  </span>
                </li>
              ))}
              <li className="flex justify-between gap-3 py-0.5 text-white/40">
                <span>Livraison</span>
                <span className="lining-nums">
                  {commande.livraison === 0 ? "Offerte" : formatPrix(commande.livraison, devise)}
                </span>
              </li>
            </ul>

            {commande.note && (
              <p className="mt-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-xs font-light leading-relaxed text-white/55">
                « {commande.note} »
              </p>
            )}

            <p className="mt-2 text-[0.65rem] font-light text-white/30 lining-nums">
              Réf. {commande.reference} · {formatHorodatage(commande.cree_le)}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {SUITES[commande.statut].map((suite) => (
                <button
                  key={suite}
                  type="button"
                  disabled={enCours}
                  onClick={() => changer(commande.id, suite)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs disabled:opacity-40 ${
                    suite === "annulee"
                      ? "border-red-400/30 text-red-300"
                      : "border-gold/35 text-gold"
                  }`}
                >
                  {LIBELLES[suite]}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
