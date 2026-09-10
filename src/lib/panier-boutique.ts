"use client";

import { useSyncExternalStore } from "react";

const CLE_STOCKAGE = "cylia.boutique.v1";

export type LignePanier = { produit_id: string; quantite: number };

/** Référence stable renvoyée au rendu serveur : le panier y est toujours vide. */
const VIDE: readonly LignePanier[] = [];

let panier: readonly LignePanier[] = VIDE;
let chargeDepuisStockage = false;
const abonnes = new Set<() => void>();

function lireStockage(): readonly LignePanier[] {
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    const valeurs = brut ? (JSON.parse(brut) as unknown) : null;
    if (!Array.isArray(valeurs)) return VIDE;
    return valeurs
      .filter(
        (v): v is LignePanier =>
          typeof v === "object" && v !== null &&
          typeof (v as LignePanier).produit_id === "string" &&
          Number.isFinite((v as LignePanier).quantite),
      )
      .map((v) => ({ produit_id: v.produit_id, quantite: borner(v.quantite) }));
  } catch {
    // Navigation privée, stockage refusé, JSON corrompu : panier vide.
    return VIDE;
  }
}

function borner(quantite: number): number {
  return Math.min(99, Math.max(1, Math.round(quantite)));
}

function definir(valeurs: readonly LignePanier[]): void {
  panier = valeurs.length > 0 ? valeurs : VIDE;
  try {
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(panier));
  } catch {
    // Le panier reste valable pour la session même si l'écriture échoue.
  }
  abonnes.forEach((notifier) => notifier());
}

function sabonner(notifier: () => void): () => void {
  abonnes.add(notifier);
  return () => {
    abonnes.delete(notifier);
  };
}

/**
 * `useSyncExternalStore` impose de renvoyer la *même* référence tant que rien
 * n'a changé, sinon React boucle. D'où le chargement paresseux fait une seule
 * fois, et `VIDE` comme constante partagée.
 */
function instantane(): readonly LignePanier[] {
  if (!chargeDepuisStockage && typeof window !== "undefined") {
    panier = lireStockage();
    chargeDepuisStockage = true;
  }
  return panier;
}

function instantaneServeur(): readonly LignePanier[] {
  return VIDE;
}

export function usePanierBoutique(): readonly LignePanier[] {
  return useSyncExternalStore(sabonner, instantane, instantaneServeur);
}

/** Nombre total d'articles, toutes quantités confondues. */
export function totalArticles(lignes: readonly LignePanier[]): number {
  return lignes.reduce((total, l) => total + l.quantite, 0);
}

export function ajouterAuPanier(produit_id: string, quantite = 1): void {
  const actuel = instantane();
  const existante = actuel.find((l) => l.produit_id === produit_id);
  definir(
    existante
      ? actuel.map((l) =>
          l.produit_id === produit_id ? { ...l, quantite: borner(l.quantite + quantite) } : l,
        )
      : [...actuel, { produit_id, quantite: borner(quantite) }],
  );
}

export function reglerQuantite(produit_id: string, quantite: number): void {
  if (quantite <= 0) return retirerDuPanier(produit_id);
  definir(
    instantane().map((l) =>
      l.produit_id === produit_id ? { ...l, quantite: borner(quantite) } : l,
    ),
  );
}

export function retirerDuPanier(produit_id: string): void {
  definir(instantane().filter((l) => l.produit_id !== produit_id));
}

export function viderPanierBoutique(): void {
  definir(VIDE);
}
