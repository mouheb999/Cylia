"use server";

import { clientPublic } from "@/lib/supabase/public";

export type ArticleCommande = {
  produit_id: string;
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
  TELEPHONE_INVALIDE: "Numéro à 8 chiffres, ex. 54 395 168.",
  ADRESSE_INVALIDE: "Indiquez une adresse de livraison complète.",
  VILLE_INVALIDE: "Indiquez votre ville.",
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
 * Passe la commande.
 *
 * Le navigateur n'envoie que des identifiants et des quantités : `creer_commande`
 * relit les prix, applique les frais de livraison et décrémente le stock dans
 * la même transaction.
 */
export async function passerCommande(demande: {
  articles: { produit_id: string; quantite: number }[];
  nom: string;
  telephone: string;
  adresse: string;
  ville: string;
  email?: string;
  note?: string;
}): Promise<ReponseCommande> {
  try {
    const { data, error } = await clientPublic().rpc("creer_commande", {
      p_articles: demande.articles.map((a) => ({
        produit_id: a.produit_id,
        quantite: a.quantite,
      })),
      p_nom: demande.nom,
      p_telephone: demande.telephone,
      p_adresse: demande.adresse,
      p_ville: demande.ville,
      p_email: demande.email || null,
      p_note: demande.note || null,
    });
    if (error) throw error;
    return { ok: true, commande: data as CommandeConfirmee };
  } catch (erreur) {
    return { ok: false, message: messageErreur(erreur) };
  }
}
