"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { enregistrerContenu, reinitialiserContenu } from "@/app/actions/admin";
import { champSombre } from "@/components/ui/champs";
import { CONTENUS_DEFAUT, GROUPES_CONTENU, type CleContenu } from "@/lib/contenu";

/** Les clés qui tiennent sur plusieurs lignes méritent un bloc de saisie. */
const LONGUES = new Set<string>([
  "hero.texte",
  "boutique.accueil_texte",
  "boutique.texte",
  "maps.requete",
]);

function libelleDe(cle: string): string {
  return cle.split(".")[1].replace(/_/g, " ");
}

export default function GestionContenu({ contenus }: { contenus: Record<string, string> }) {
  const router = useRouter();
  const [valeurs, setValeurs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      GROUPES_CONTENU.flatMap((g) => g.cles).map((cle) => [
        cle,
        contenus[cle] ?? CONTENUS_DEFAUT[cle],
      ]),
    ),
  );
  const [modifiee, setModifiee] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function enregistrer(cle: CleContenu) {
    setErreur(null);
    demarrer(async () => {
      const reponse = await enregistrerContenu(cle, valeurs[cle]);
      if (!reponse.ok) return setErreur(reponse.message);
      setModifiee(cle);
      router.refresh();
    });
  }

  function reinitialiser(cle: CleContenu) {
    setErreur(null);
    demarrer(async () => {
      const reponse = await reinitialiserContenu(cle);
      if (!reponse.ok) return setErreur(reponse.message);
      setValeurs((v) => ({ ...v, [cle]: CONTENUS_DEFAUT[cle] }));
      setModifiee(cle);
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

      {GROUPES_CONTENU.map((groupe) => (
        <section key={groupe.titre} className="mb-8">
          <h2 className="font-serif text-lg font-light text-gold">{groupe.titre}</h2>

          <div className="mt-3 space-y-4">
            {groupe.cles.map((cle) => {
              const personnalise = (contenus[cle] ?? "") !== "";
              const change = valeurs[cle] !== (contenus[cle] ?? CONTENUS_DEFAUT[cle]);
              return (
                <div key={cle} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <label className="block text-sm">
                    <span className="font-light capitalize text-white/60">{libelleDe(cle)}</span>
                    {LONGUES.has(cle) ? (
                      <textarea
                        value={valeurs[cle]}
                        onChange={(e) => setValeurs((v) => ({ ...v, [cle]: e.target.value }))}
                        rows={3}
                        className={`${champSombre} resize-none`}
                      />
                    ) : (
                      <input
                        value={valeurs[cle]}
                        onChange={(e) => setValeurs((v) => ({ ...v, [cle]: e.target.value }))}
                        className={champSombre}
                      />
                    )}
                  </label>

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={enCours || !change}
                      onClick={() => enregistrer(cle)}
                      className="rounded-full border border-gold/35 px-3.5 py-1.5 text-xs text-gold disabled:opacity-30"
                    >
                      Enregistrer
                    </button>
                    {personnalise && (
                      <button
                        type="button"
                        disabled={enCours}
                        onClick={() => reinitialiser(cle)}
                        className="rounded-full border border-white/12 px-3.5 py-1.5 text-xs text-white/50 disabled:opacity-30"
                      >
                        Version d&apos;origine
                      </button>
                    )}
                    {modifiee === cle && !change && (
                      <span className="text-xs font-light text-emerald-300">Enregistré</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
