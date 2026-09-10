"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { passerCommande, type CommandeConfirmee } from "@/app/actions/boutique";
import { boutonOr, champSombre } from "@/components/ui/champs";
import { formatPrix } from "@/lib/format";
import {
  reglerQuantite,
  retirerDuPanier,
  usePanierBoutique,
  viderPanierBoutique,
} from "@/lib/panier-boutique";
import type { Produit, Reglages } from "@/lib/supabase/types";
import VisuelProduit from "./VisuelProduit";

/** 8 chiffres, avec ou sans indicatif +216 et espaces. */
function telephoneValide(valeur: string): boolean {
  const chiffres = valeur.replace(/[\s.-]/g, "").replace(/^\+?216/, "");
  return /^\d{8}$/.test(chiffres);
}

export default function PanierClient({
  produits,
  reglages,
}: {
  produits: Produit[];
  reglages: Reglages;
}) {
  const lignes = usePanierBoutique();
  const [commande, setCommande] = useState<CommandeConfirmee | null>(null);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [ville, setVille] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);
  const [envoi, demarrer] = useTransition();

  const parId = useMemo(() => new Map(produits.map((p) => [p.id, p])), [produits]);

  // Un produit retiré de la boutique depuis la dernière visite disparaît du
  // panier plutôt que de faire échouer la commande au dernier moment.
  const articles = lignes
    .map((ligne) => ({ ligne, produit: parId.get(ligne.produit_id) }))
    .filter((a): a is { ligne: typeof a.ligne; produit: Produit } => a.produit !== undefined);

  const sousTotal = articles.reduce((t, a) => t + a.produit.prix * a.ligne.quantite, 0);
  const livraisonOfferte =
    reglages.livraison_gratuite_des != null && sousTotal >= reglages.livraison_gratuite_des;
  const livraison = articles.length === 0 || livraisonOfferte ? 0 : reglages.frais_livraison;

  if (commande) {
    return (
      <div className="px-5 pb-16 text-center">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold-deep/40"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-gold-deep" fill="none" stroke="currentColor" strokeWidth={1.2}>
            <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="mt-5 font-serif text-2xl font-light text-ink">
          Commande
          <span className="mt-0.5 block font-script text-3xl text-gold-deep">enregistrée</span>
        </h2>

        <dl className="mt-7 rounded-2xl border border-sand bg-white px-5 py-5 text-left text-sm">
          {commande.articles.map((article) => (
            <div key={article.produit_id} className="flex justify-between gap-4 border-b border-sand/70 pb-2 pt-2 first:pt-0 last:border-0">
              <dt className="font-light text-muted">
                {article.nom} × {article.quantite}
              </dt>
              <dd className="text-right text-ink lining-nums">
                {formatPrix(article.prix * article.quantite, reglages.devise)}
              </dd>
            </div>
          ))}
          <div className="mt-3 flex justify-between gap-4">
            <dt className="font-light text-muted">Livraison</dt>
            <dd className="text-right text-ink lining-nums">
              {commande.livraison === 0 ? "Offerte" : formatPrix(commande.livraison, reglages.devise)}
            </dd>
          </div>
          <div className="mt-2 flex justify-between gap-4 border-t border-sand pt-2">
            <dt className="text-ink">Total</dt>
            <dd className="text-right font-serif text-lg text-gold-deep lining-nums">
              {formatPrix(commande.total, reglages.devise)}
            </dd>
          </div>
          <div className="mt-3 flex justify-between gap-4 border-t border-sand pt-3">
            <dt className="font-light text-muted">Référence</dt>
            <dd className="text-right font-serif tracking-wider text-gold-deep lining-nums">
              {commande.reference}
            </dd>
          </div>
        </dl>

        <p className="mt-5 text-[0.8rem] font-light leading-relaxed text-muted">
          Nous vous appelons au {commande.telephone} pour confirmer la livraison
          à {commande.ville}. Paiement à la réception.
        </p>

        <Link
          href="/boutique"
          className="gold-gradient mt-7 block rounded-full py-3.5 font-serif text-base text-noir"
        >
          Continuer mes achats
        </Link>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="px-5 pb-16 pt-4 text-center">
        <p className="rounded-2xl border border-sand bg-white px-5 py-10 text-sm font-light leading-relaxed text-muted">
          Votre panier est vide.
        </p>
        <Link
          href="/boutique"
          className="gold-gradient mt-5 block rounded-full py-3.5 font-serif text-base text-noir"
        >
          Découvrir la boutique
        </Link>
      </div>
    );
  }

  function soumettre(evenement: React.FormEvent) {
    evenement.preventDefault();

    const nouvelles: Record<string, string> = {};
    if (nom.trim().length < 2) nouvelles.nom = "Indiquez votre nom.";
    if (!telephoneValide(telephone)) nouvelles.telephone = "Numéro à 8 chiffres, ex. 54 395 168.";
    if (adresse.trim().length < 5) nouvelles.adresse = "Indiquez une adresse complète.";
    if (ville.trim().length < 2) nouvelles.ville = "Indiquez votre ville.";

    setErreurs(nouvelles);
    if (Object.keys(nouvelles).length > 0) return;

    setErreurEnvoi(null);
    demarrer(async () => {
      const reponse = await passerCommande({
        articles: articles.map((a) => ({
          produit_id: a.produit.id,
          quantite: a.ligne.quantite,
        })),
        nom: nom.trim(),
        telephone: telephone.trim(),
        adresse: adresse.trim(),
        ville: ville.trim(),
        email: email.trim() || undefined,
        note: note.trim() || undefined,
      });
      if (!reponse.ok) {
        setErreurEnvoi(reponse.message);
        return;
      }
      viderPanierBoutique();
      setCommande(reponse.commande);
    });
  }

  const champ = `${champSombre} border-sand bg-white text-ink placeholder:text-muted/60 focus:border-gold-deep`;

  return (
    <div className="px-5 pb-16 pt-4">
      <ul className="space-y-3">
        {articles.map(({ ligne, produit }) => (
          <li
            key={produit.id}
            className="flex gap-3 rounded-2xl border border-sand bg-white p-3"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-noir">
              <VisuelProduit
                nom={produit.nom}
                marque={produit.marque}
                url={produit.image_url}
                sizes="80px"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <p className="font-serif text-[0.95rem] leading-snug text-ink">{produit.nom}</p>
              <p className="mt-0.5 text-sm text-gold-deep lining-nums">
                {formatPrix(produit.prix, reglages.devise)}
              </p>

              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center gap-3 rounded-full border border-sand px-2 py-1">
                  <button
                    type="button"
                    onClick={() => reglerQuantite(produit.id, ligne.quantite - 1)}
                    aria-label={`Retirer un ${produit.nom}`}
                    className="px-2 text-lg text-gold-deep"
                  >
                    −
                  </button>
                  <span className="min-w-4 text-center text-sm text-ink lining-nums">
                    {ligne.quantite}
                  </span>
                  <button
                    type="button"
                    onClick={() => reglerQuantite(produit.id, ligne.quantite + 1)}
                    disabled={ligne.quantite >= produit.stock}
                    aria-label={`Ajouter un ${produit.nom}`}
                    className="px-2 text-lg text-gold-deep disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => retirerDuPanier(produit.id)}
                  className="text-xs font-light text-muted"
                >
                  Retirer
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <dl className="mt-5 rounded-2xl border border-sand bg-white px-4 py-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="font-light text-muted">Sous-total</dt>
          <dd className="text-ink lining-nums">{formatPrix(sousTotal, reglages.devise)}</dd>
        </div>
        <div className="mt-2 flex justify-between gap-4">
          <dt className="font-light text-muted">Livraison</dt>
          <dd className="text-ink lining-nums">
            {livraison === 0 ? "Offerte" : formatPrix(livraison, reglages.devise)}
          </dd>
        </div>
        <div className="mt-3 flex justify-between gap-4 border-t border-sand pt-3">
          <dt className="text-ink">Total</dt>
          <dd className="font-serif text-lg text-gold-deep lining-nums">
            {formatPrix(sousTotal + livraison, reglages.devise)}
          </dd>
        </div>
        {!livraisonOfferte && reglages.livraison_gratuite_des != null && (
          <p className="mt-2 text-xs font-light text-muted">
            Livraison offerte à partir de{" "}
            {formatPrix(reglages.livraison_gratuite_des, reglages.devise)}.
          </p>
        )}
      </dl>

      <form onSubmit={soumettre} noValidate className="mt-7">
        <h2 className="font-serif text-xl font-light text-ink">Livraison</h2>

        <label className="mt-4 block text-sm">
          <span className="font-light text-muted">Nom</span>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            autoComplete="name"
            className={champ}
            aria-invalid={Boolean(erreurs.nom)}
          />
          {erreurs.nom && <span className="mt-1 block text-xs text-red-500">{erreurs.nom}</span>}
        </label>

        <label className="mt-4 block text-sm">
          <span className="font-light text-muted">Téléphone</span>
          <input
            type="tel"
            inputMode="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            autoComplete="tel"
            placeholder="54 395 168"
            className={champ}
            aria-invalid={Boolean(erreurs.telephone)}
          />
          {erreurs.telephone && (
            <span className="mt-1 block text-xs text-red-500">{erreurs.telephone}</span>
          )}
        </label>

        <label className="mt-4 block text-sm">
          <span className="font-light text-muted">Adresse</span>
          <textarea
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            rows={2}
            autoComplete="street-address"
            placeholder="Rue, immeuble, étage…"
            className={`${champ} resize-none`}
            aria-invalid={Boolean(erreurs.adresse)}
          />
          {erreurs.adresse && (
            <span className="mt-1 block text-xs text-red-500">{erreurs.adresse}</span>
          )}
        </label>

        <label className="mt-4 block text-sm">
          <span className="font-light text-muted">Ville</span>
          <input
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            autoComplete="address-level2"
            placeholder="Sousse"
            className={champ}
            aria-invalid={Boolean(erreurs.ville)}
          />
          {erreurs.ville && <span className="mt-1 block text-xs text-red-500">{erreurs.ville}</span>}
        </label>

        <label className="mt-4 block text-sm">
          <span className="font-light text-muted">E-mail (facultatif)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={champ}
          />
        </label>

        <label className="mt-4 block text-sm">
          <span className="font-light text-muted">Précision (facultatif)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className={`${champ} resize-none`}
          />
        </label>

        {erreurEnvoi && (
          <p role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
            {erreurEnvoi}
          </p>
        )}

        <button type="submit" disabled={envoi} className={`${boutonOr} mt-6 w-full`}>
          {envoi ? "Enregistrement…" : "Commander"}
        </button>

        <p className="mt-3 text-center text-xs font-light text-muted">
          Paiement à la livraison. Nous vous appelons pour confirmer.
        </p>
      </form>
    </div>
  );
}
