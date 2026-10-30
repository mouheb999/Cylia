"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { passerCommande, type CommandeConfirmee } from "@/app/actions/boutique";
import { IconWhatsApp } from "@/components/Icons";
import LienSuivi from "@/components/LienSuivi";
import { boutonOr, champClair } from "@/components/ui/champs";
import { produitsDuCoffret, stockDuCoffret, visuelsDuCoffret } from "@/lib/coffrets";
import { formatPrix } from "@/lib/format";
import { GOUVERNORATS, estGouvernorat } from "@/lib/gouvernorats";
import { trackMeta, type ArticleMeta } from "@/lib/meta/track";
import {
  cleLigne,
  reglerQuantite,
  retirerDuPanier,
  usePanierBoutique,
  viderPanierBoutique,
} from "@/lib/panier-boutique";
import type { Coffret, Produit, Reglages } from "@/lib/supabase/types";
import { mobileTunisienValide } from "@/lib/telephone";
import VisuelCoffret from "./VisuelCoffret";
import VisuelProduit from "./VisuelProduit";

/** Une ligne du panier, flacon ou coffret, telle que la page l'affiche. */
type Article = {
  cle: string;
  nom: string;
  /** Sous le nom : la gamme d'un flacon, le contenu d'un coffret. */
  detail: string;
  prix: number;
  quantite: number;
  stock: number;
  visuel: React.ReactNode;
  envoi: { produit_id: string } | { coffret_id: string };
  /** La même ligne, telle que Meta la voit. */
  meta: ArticleMeta;
};

/** Le WhatsApp de la boutique — le même que « Besoin de conseil ? ». */
const NUMERO_WHATSAPP = "21651395169";

type Champ = "nom" | "telephone" | "gouvernorat";

/** Les trois champs obligatoires, et ce qu'on dit quand l'un ne va pas. */
function erreurDe(champ: Champ, valeur: string): string | undefined {
  switch (champ) {
    case "nom":
      return valeur.trim().length < 2 ? "Indiquez votre nom." : undefined;
    case "telephone":
      if (!valeur.trim()) return "Indiquez votre numéro de téléphone.";
      return mobileTunisienValide(valeur)
        ? undefined
        : "Numéro de mobile tunisien à 8 chiffres, commençant par 2, 4, 5 ou 9 — ex. 54 395 168.";
    case "gouvernorat":
      return estGouvernorat(valeur) ? undefined : "Choisissez votre gouvernorat.";
  }
}

export default function PanierClient({
  produits,
  coffrets,
  reglages,
}: {
  produits: Produit[];
  coffrets: Coffret[];
  reglages: Reglages;
}) {
  const lignes = usePanierBoutique();
  const [commande, setCommande] = useState<CommandeConfirmee | null>(null);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [gouvernorat, setGouvernorat] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [erreurs, setErreurs] = useState<Partial<Record<Champ, string>>>({});
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);
  const [envoi, demarrer] = useTransition();

  const parId = useMemo(() => new Map(produits.map((p) => [p.id, p])), [produits]);
  const coffretParId = useMemo(() => new Map(coffrets.map((c) => [c.id, c])), [coffrets]);

  // Un produit ou un coffret retiré de la boutique depuis la dernière visite
  // disparaît du panier plutôt que de faire échouer la commande au dernier
  // moment.
  const articles: Article[] = lignes.flatMap((ligne): Article[] => {
    if (ligne.coffret_id) {
      const coffret = coffretParId.get(ligne.coffret_id);
      if (!coffret) return [];
      return [
        {
          cle: cleLigne(ligne),
          nom: coffret.nom,
          detail: produitsDuCoffret(coffret, produits)
            .map((p) => p.nom)
            .join(" · "),
          prix: coffret.prix,
          quantite: ligne.quantite,
          stock: stockDuCoffret(coffret, produits),
          visuel: (
            <VisuelCoffret nom={coffret.nom} photos={visuelsDuCoffret(coffret, produits)} sizes="80px" />
          ),
          envoi: { coffret_id: coffret.id },
          meta: { id: coffret.id, name: coffret.nom, priceTnd: coffret.prix, quantity: ligne.quantite },
        },
      ];
    }
    const produit = ligne.produit_id ? parId.get(ligne.produit_id) : undefined;
    if (!produit) return [];
    return [
      {
        cle: cleLigne(ligne),
        nom: produit.nom,
        detail: "",
        prix: produit.prix,
        quantite: ligne.quantite,
        stock: produit.stock,
        visuel: (
          <VisuelProduit
            nom={produit.nom}
            marque={produit.marque}
            url={produit.image_url}
            sizes="80px"
            padding="p-1.5"
            compact
          />
        ),
        envoi: { produit_id: produit.id },
        meta: { id: produit.id, name: produit.nom, priceTnd: produit.prix, quantity: ligne.quantite },
      },
    ];
  });

  /*
   * Mise en caisse : une seule fois, au premier champ de livraison touché —
   * jamais à l'ouverture de la page. Arriver au panier n'est pas encore
   * vouloir commander ; commencer à remplir le formulaire, si. Tout le contenu
   * du panier part.
   */
  const caisseSignalee = useRef(false);

  function signalerCaisse(evenement: React.FocusEvent<HTMLFormElement>) {
    if (!(evenement.target instanceof HTMLInputElement ||
      evenement.target instanceof HTMLSelectElement ||
      evenement.target instanceof HTMLTextAreaElement)) return;
    if (caisseSignalee.current || articles.length === 0) return;
    caisseSignalee.current = true;
    trackMeta("InitiateCheckout", articles.map((a) => a.meta));
  }

  const sousTotal = articles.reduce((t, a) => t + a.prix * a.quantite, 0);
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
          {commande.articles.map((article, index) => (
            <div key={index} className="flex justify-between gap-4 border-b border-sand/70 pb-2 pt-2 first:pt-0 last:border-0">
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
            <dd className="text-right font-serif text-2xl font-semibold leading-none text-gold-deep lining-nums">
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
          (gouvernorat de {commande.ville}). Paiement à la réception.
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

  const valeurs: Record<Champ, string> = { nom, telephone, gouvernorat };

  /** À la sortie d'un champ : on le juge dès qu'il a été rempli une fois. */
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
    for (const champ of ["nom", "telephone", "gouvernorat"] as const) {
      const erreur = erreurDe(champ, valeurs[champ]);
      if (erreur) nouvelles[champ] = erreur;
    }

    setErreurs(nouvelles);
    const premier = (["nom", "telephone", "gouvernorat"] as const).find((c) => nouvelles[c]);
    if (premier) {
      evenement.currentTarget.querySelector<HTMLElement>(`[name="${premier}"]`)?.focus();
      return;
    }

    setErreurEnvoi(null);
    demarrer(async () => {
      const reponse = await passerCommande({
        articles: articles.map((a) => ({ ...a.envoi, quantite: a.quantite })),
        nom: nom.trim(),
        telephone: telephone.trim(),
        adresse: adresse.trim(),
        ville: gouvernorat,
        email: email.trim() || undefined,
        note: note.trim() || undefined,
      });
      if (!reponse.ok) {
        setErreurEnvoi(reponse.message);
        return;
      }
      // Seulement ici, commande enregistrée. La confirmation ne vit qu'en
      // mémoire et le panier est vidé : un rafraîchissement ne la réaffiche
      // pas, et `trackMeta` refuse de toute façon une référence déjà vue.
      const confirmee = reponse.commande;
      trackMeta(
        "Purchase",
        confirmee.articles.map((a) => ({
          id: a.coffret_id ?? a.produit_id ?? a.nom,
          name: a.nom,
          priceTnd: Number(a.prix),
          quantity: a.quantite,
        })),
        { orderId: confirmee.reference, valeurTnd: Number(confirmee.total) },
      );
      viderPanierBoutique();
      setCommande(confirmee);
    });
  }

  const champ = champClair;
  const total = sousTotal + livraison;

  // « Livraison offerte » ne se promet que si c'est vrai pour ce panier.
  const promesseLivraison =
    livraison === 0
      ? "Livraison offerte"
      : reglages.livraison_gratuite_des != null
        ? `Livraison offerte dès ${formatPrix(reglages.livraison_gratuite_des, reglages.devise)}`
        : `Livraison ${formatPrix(reglages.frais_livraison, reglages.devise)}`;

  // La commande par WhatsApp : le panier tel qu'il est, et ce qui est déjà
  // rempli du formulaire — le salon n'a plus qu'à confirmer.
  const messageWhatsApp = [
    "Bonjour CYLIA, je souhaite commander :",
    ...articles.map(
      (a) => `• ${a.nom} × ${a.quantite} — ${formatPrix(a.prix * a.quantite, reglages.devise)}`,
    ),
    `Livraison : ${livraison === 0 ? "offerte" : formatPrix(livraison, reglages.devise)}`,
    `Total : ${formatPrix(total, reglages.devise)} (paiement à la livraison)`,
    ...(nom.trim() ? [`Nom : ${nom.trim()}`] : []),
    ...(telephone.trim() ? [`Téléphone : ${telephone.trim()}`] : []),
    ...(gouvernorat ? [`Gouvernorat : ${gouvernorat}`] : []),
    ...(adresse.trim() ? [`Adresse : ${adresse.trim()}`] : []),
  ].join("\n");

  return (
    <div className="px-5 pb-16 pt-4">
      <ul className="space-y-3">
        {articles.map((article) => (
          <li
            key={article.cle}
            className="flex gap-3 rounded-2xl border border-sand bg-white p-3"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
              {article.visuel}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <p className="font-serif text-[0.95rem] leading-snug text-ink">{article.nom}</p>
              {article.detail && (
                <p className="mt-0.5 line-clamp-2 text-[0.7rem] font-light leading-snug text-muted">
                  {article.detail}
                </p>
              )}
              <p className="mt-1 font-serif text-lg font-semibold leading-none text-gold-deep lining-nums">
                {formatPrix(article.prix, reglages.devise)}
              </p>

              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center gap-3 rounded-full border border-sand px-2 py-1">
                  <button
                    type="button"
                    onClick={() => reglerQuantite(article.cle, article.quantite - 1)}
                    aria-label={`Retirer un ${article.nom}`}
                    className="px-2 text-lg text-gold-deep"
                  >
                    −
                  </button>
                  <span className="min-w-4 text-center text-sm text-ink lining-nums">
                    {article.quantite}
                  </span>
                  <button
                    type="button"
                    onClick={() => reglerQuantite(article.cle, article.quantite + 1)}
                    disabled={article.quantite >= article.stock}
                    aria-label={`Ajouter un ${article.nom}`}
                    className="px-2 text-lg text-gold-deep disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => retirerDuPanier(article.cle)}
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
          <dd className="font-serif text-2xl font-semibold leading-none text-gold-deep lining-nums">
            {formatPrix(total, reglages.devise)}
          </dd>
        </div>
        {!livraisonOfferte && reglages.livraison_gratuite_des != null && (
          <p className="mt-2 text-xs font-light text-muted">
            Livraison offerte à partir de{" "}
            {formatPrix(reglages.livraison_gratuite_des, reglages.devise)}.
          </p>
        )}
      </dl>

      <form onSubmit={soumettre} onFocus={signalerCaisse} noValidate className="mt-7">
        <h2 className="font-serif text-xl font-light text-ink">Livraison</h2>

        <label className="mt-4 block text-sm">
          <span className="font-light text-muted">Nom</span>
          <input
            name="nom"
            value={nom}
            onChange={(e) => {
              setNom(e.target.value);
              corriger("nom", e.target.value);
            }}
            onBlur={() => nom && verifier("nom")}
            autoComplete="name"
            required
            className={champ}
            aria-invalid={Boolean(erreurs.nom)}
            aria-describedby={erreurs.nom ? "erreur-nom" : undefined}
          />
          {erreurs.nom && (
            <span id="erreur-nom" className="mt-1 block text-xs text-red-500">{erreurs.nom}</span>
          )}
        </label>

        <label className="mt-4 block text-sm">
          <span className="font-light text-muted">Téléphone</span>
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
            placeholder="54 395 168"
            required
            className={champ}
            aria-invalid={Boolean(erreurs.telephone)}
            aria-describedby={erreurs.telephone ? "erreur-telephone" : undefined}
          />
          {erreurs.telephone && (
            <span id="erreur-telephone" className="mt-1 block text-xs text-red-500">
              {erreurs.telephone}
            </span>
          )}
        </label>

        <label className="mt-4 block text-sm">
          <span className="font-light text-muted">Gouvernorat</span>
          <span className="relative block">
            <select
              name="gouvernorat"
              value={gouvernorat}
              onChange={(e) => {
                setGouvernorat(e.target.value);
                verifier("gouvernorat", e.target.value);
              }}
              autoComplete="address-level1"
              required
              className={`${champ} appearance-none pr-10 ${gouvernorat ? "" : "text-muted/80"}`}
              aria-invalid={Boolean(erreurs.gouvernorat)}
              aria-describedby={erreurs.gouvernorat ? "erreur-gouvernorat" : undefined}
            >
              <option value="" disabled>
                Choisissez…
              </option>
              {GOUVERNORATS.map((g) => (
                <option key={g} value={g} className="text-ink">
                  {g}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 mt-[3px] h-4 w-4 -translate-y-1/2 text-gold-deep"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {erreurs.gouvernorat && (
            <span id="erreur-gouvernorat" className="mt-1 block text-xs text-red-500">
              {erreurs.gouvernorat}
            </span>
          )}
        </label>

        <label className="mt-4 block text-sm">
          <span className="font-light text-muted">Adresse (facultatif)</span>
          <textarea
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            rows={2}
            autoComplete="street-address"
            placeholder="Ville, rue, immeuble… — sinon on vous la demande à l'appel"
            className={`${champ} resize-none`}
          />
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

        {/* Juste au-dessus du bouton : ce qui lève les dernières hésitations. */}
        <ul className="mt-6 flex flex-wrap justify-center gap-x-2 gap-y-1 text-center text-[0.75rem] leading-snug text-ink/80">
          <li><span className="text-gold-deep">✓</span> Paiement à la livraison</li>
          <li aria-hidden="true" className="text-gold-deep/60">·</li>
          <li><span className="text-gold-deep">✓</span> {promesseLivraison}</li>
          <li aria-hidden="true" className="text-gold-deep/60">·</li>
          <li>
            <span className="text-gold-deep">✓</span> Revendeur officiel Keune — produits 100%
            authentiques
          </li>
          <li aria-hidden="true" className="text-gold-deep/60">·</li>
          <li>Livraison 24–72h</li>
        </ul>

        <button type="submit" disabled={envoi} className={`${boutonOr} mt-3 w-full`}>
          {envoi ? "Enregistrement…" : "Commander"}
        </button>

        <LienSuivi
          evenement="Contact"
          parametres={{ method: "whatsapp", content_name: "commande" }}
          href={`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(messageWhatsApp)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-full border border-gold-deep/40 py-3 font-serif text-base text-gold-deep"
        >
          <IconWhatsApp className="h-4 w-4 shrink-0" />
          Commander sur WhatsApp
        </LienSuivi>

        <p className="mt-3 text-center text-xs font-light text-muted">
          Nous vous appelons pour confirmer avant l&apos;envoi.
        </p>
      </form>
    </div>
  );
}
