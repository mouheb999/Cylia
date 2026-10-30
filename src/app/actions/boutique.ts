"use server";

import { cookies, headers } from "next/headers";
import { after } from "next/server";
import { estGouvernorat } from "@/lib/gouvernorats";
import { adresseIp, decouperNom, envoyerEvenementMeta } from "@/lib/meta/capi";
import { parametresMeta } from "@/lib/meta/track";
import { clientPublic } from "@/lib/supabase/public";
import { DELAI_ECRITURE } from "@/lib/supabase/config";
import { mobileTunisienValide } from "@/lib/telephone";

/**
 * L'adresse est facultative au panier : la cliente donne son gouvernorat, et
 * le salon lui demande le reste à l'appel de confirmation. `creer_commande`
 * exige pourtant une adresse d'au moins cinq caractères — cette mention en
 * tient lieu, et dit au salon ce qu'il lui reste à faire.
 */
const ADRESSE_A_PRECISER = "À préciser lors de l'appel";

export type ArticleCommande = {
  /** Nul pour un coffret, qui porte alors `coffret_id`. */
  produit_id: string | null;
  coffret_id?: string | null;
  nom: string;
  prix: number;
  quantite: number;
};

export type CommandeConfirmee = {
  reference: string;
  nom: string;
  telephone: string;
  adresse: string;
  ville: string;
  sous_total: number;
  livraison: number;
  total: number;
  cree_le: string;
  articles: ArticleCommande[];
};

export type ReponseCommande =
  | { ok: true; commande: CommandeConfirmee }
  | { ok: false; message: string };

const MESSAGES: Record<string, string> = {
  BOUTIQUE_FERMEE: "La boutique est momentanément fermée.",
  NOM_INVALIDE: "Indiquez votre nom.",
  TELEPHONE_INVALIDE:
    "Numéro de mobile tunisien à 8 chiffres, commençant par 2, 4, 5 ou 9 — ex. 54 395 168.",
  ADRESSE_INVALIDE: "Indiquez une adresse de livraison complète.",
  VILLE_INVALIDE: "Choisissez votre gouvernorat.",
  EMAIL_INVALIDE: "Cette adresse e-mail semble incorrecte.",
  PANIER_INVALIDE: "Votre panier est vide ou n'est plus valable.",
  PRODUIT_INTROUVABLE: "Un produit de votre panier n'est plus disponible.",
};

function messageErreur(erreur: unknown): string {
  const brut = erreur instanceof Error ? erreur.message : String(erreur);
  // « STOCK_INSUFFISANT:Sérum éclat » — le nom du produit fait le message.
  const rupture = brut.match(/STOCK_INSUFFISANT:(.+?)(?:$|["\\])/);
  if (rupture) return `Stock insuffisant pour « ${rupture[1].trim()} ».`;
  for (const [code, phrase] of Object.entries(MESSAGES)) {
    if (brut.includes(code)) return phrase;
  }
  console.error("[cylia] commande :", erreur);
  return "La commande n'a pas pu être enregistrée. Réessayez dans un instant.";
}

/**
 * L'achat, remonté à Meta par l'API Conversions.
 *
 * Il part du serveur, une fois la commande enregistrée, avec les montants que
 * `creer_commande` a relus en base — jamais ceux qu'aurait envoyés le
 * navigateur. `order_<référence>` est aussi l'`eventID` du `Purchase` que le
 * pixel envoie sur la page de confirmation : Meta n'en garde qu'un.
 */
async function signalerAchat(commande: CommandeConfirmee, email: string | undefined) {
  const [entetes, biscuits] = await Promise.all([headers(), cookies()]);
  await envoyerEvenementMeta({
    event: "Purchase",
    eventId: `order_${commande.reference}`,
    params: parametresMeta(
      commande.articles.map((a) => ({
        id: a.coffret_id ?? a.produit_id ?? a.nom,
        name: a.nom,
        priceTnd: Number(a.prix),
        quantity: a.quantite,
      })),
      Number(commande.total),
    ),
    url: entetes.get("referer"),
    user: {
      phone: commande.telephone,
      email,
      city: commande.ville,
      ...decouperNom(commande.nom),
    },
    navigateur: {
      ip: adresseIp(entetes),
      userAgent: entetes.get("user-agent"),
      fbp: biscuits.get("_fbp")?.value ?? null,
      fbc: biscuits.get("_fbc")?.value ?? null,
    },
  });
}

/**
 * Passe la commande.
 *
 * Le navigateur n'envoie que des identifiants et des quantités : `creer_commande`
 * relit les prix, applique les frais de livraison et décrémente le stock dans
 * la même transaction.
 *
 * `ville` porte le gouvernorat choisi dans la liste. Téléphone et gouvernorat
 * sont revérifiés ici : le formulaire les contrôle déjà, mais une action
 * serveur s'appelle sans passer par lui.
 */
export async function passerCommande(demande: {
  articles: (({ produit_id: string } | { coffret_id: string }) & { quantite: number })[];
  nom: string;
  telephone: string;
  adresse: string;
  ville: string;
  email?: string;
  note?: string;
}): Promise<ReponseCommande> {
  if (!mobileTunisienValide(demande.telephone)) {
    return { ok: false, message: MESSAGES.TELEPHONE_INVALIDE };
  }
  if (!estGouvernorat(demande.ville)) {
    return { ok: false, message: MESSAGES.VILLE_INVALIDE };
  }
  const adresse = demande.adresse.trim();

  try {
    const { data, error } = await clientPublic().rpc("creer_commande", {
      p_articles: demande.articles.map((a) =>
        "coffret_id" in a
          ? { coffret_id: a.coffret_id, quantite: a.quantite }
          : { produit_id: a.produit_id, quantite: a.quantite },
      ),
      p_nom: demande.nom,
      p_telephone: demande.telephone,
      p_adresse: adresse.length >= 5 ? adresse : [adresse, ADRESSE_A_PRECISER].filter(Boolean).join(" — "),
      p_ville: demande.ville,
      p_email: demande.email || null,
      p_note: demande.note || null,
    }).abortSignal(AbortSignal.timeout(DELAI_ECRITURE));
    if (error) throw error;
    const commande = data as CommandeConfirmee;
    // Après la réponse : la cliente voit sa confirmation sans attendre Meta.
    after(() => signalerAchat(commande, demande.email));
    return { ok: true, commande };
  } catch (erreur) {
    return { ok: false, message: messageErreur(erreur) };
  }
}
