"use client";

import { useSyncExternalStore } from "react";

const CLE_STOCKAGE = "cylia.boutique.v1";

/**
 * Une ligne du panier : un flacon, ou un coffret.
 *
 * Les lignes de flacon gardent leur forme d'origine — `{ produit_id, quantite }`
 * — pour que les paniers déjà enregistrés dans les navigateurs se relisent
 * tels quels. Le coffret porte `coffret_id` à la place.
 */
export type LignePanier =
  | { produit_id: string; coffret_id?: undefined; quantite: number }
  | { coffret_id: string; produit_id?: undefined; quantite: number };

/** Identité d'une ligne : deux lignes de même clé n'en font qu'une. */
export function cleLigne(ligne: LignePanier): string {
  return ligne.coffret_id ? `coffret:${ligne.coffret_id}` : `produit:${ligne.produit_id}`;
}

/** Référence stable renvoyée au rendu serveur : le panier y est toujours vide. */
const VIDE: readonly LignePanier[] = [];

let panier: readonly LignePanier[] = VIDE;
let chargeDepuisStockage = false;
const abonnes = new Set<() => void>();

function lireLigne(v: unknown): LignePanier | null {
  if (typeof v !== "object" || v === null) return null;
  const brut = v as Record<string, unknown>;
  if (!Number.isFinite(brut.quantite)) return null;
  const quantite = borner(brut.quantite as number);
  if (typeof brut.coffret_id === "string") return { coffret_id: brut.coffret_id, quantite };
  if (typeof brut.produit_id === "string") return { produit_id: brut.produit_id, quantite };
  return null;
}

function lireStockage(): readonly LignePanier[] {
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    const valeurs = brut ? (JSON.parse(brut) as unknown) : null;
    if (!Array.isArray(valeurs)) return VIDE;
    return valeurs.map(lireLigne).filter((l): l is LignePanier => l !== null);
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

function ajouter(nouvelle: LignePanier): void {
  const actuel = instantane();
  const cle = cleLigne(nouvelle);
  const existante = actuel.find((l) => cleLigne(l) === cle);
  definir(
    existante
      ? actuel.map((l) =>
          cleLigne(l) === cle ? { ...l, quantite: borner(l.quantite + nouvelle.quantite) } : l,
        )
      : [...actuel, { ...nouvelle, quantite: borner(nouvelle.quantite) }],
  );
}

export function ajouterAuPanier(produit_id: string, quantite = 1): void {
  ajouter({ produit_id, quantite });
}

export function ajouterCoffretAuPanier(coffret_id: string, quantite = 1): void {
  ajouter({ coffret_id, quantite });
}

/** `cle` : celle de `cleLigne`. */
export function reglerQuantite(cle: string, quantite: number): void {
  if (quantite <= 0) return retirerDuPanier(cle);
  definir(
    instantane().map((l) => (cleLigne(l) === cle ? { ...l, quantite: borner(quantite) } : l)),
  );
}

export function retirerDuPanier(cle: string): void {
  definir(instantane().filter((l) => cleLigne(l) !== cle));
}

export function viderPanierBoutique(): void {
  definir(VIDE);
}
