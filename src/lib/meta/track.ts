/**
 * Les évènements de vente remontés à Meta — vue, panier, caisse, achat — pour
 * la boutique comme pour les rendez-vous (où l'achat devient `Schedule`).
 *
 * Chaque évènement part deux fois, avec le même `eventID` : par le pixel du
 * navigateur, et par l'API Conversions côté serveur (`/api/meta-capi`). Meta
 * les rapproche et n'en compte qu'un ; le second sert de filet quand un
 * bloqueur de publicité ou Safari a mangé le premier.
 *
 * Ce fichier ne dépend ni du navigateur ni du serveur au chargement : ses
 * constantes et `parametresMeta` servent aussi à `lib/meta/capi.ts`, pour que
 * l'achat envoyé par le serveur porte exactement les mêmes chiffres.
 */

/**
 * Taux de conversion dinar → dollar.
 *
 * Meta ne connaît pas le dinar tunisien : une valeur en `TND` est refusée, et
 * l'optimisation sur la valeur des ventes ne marche pas sans montant. On
 * convertit donc tout en dollars, à ce taux fixe. À ajuster de temps en temps —
 * c'est le seul endroit où il vit.
 */
export const TND_TO_USD = 0.34;

/**
 * L'unique pixel du site : celui du compte publicitaire qui diffuse les
 * campagnes.
 *
 * Écrit en dur, et volontairement sans variable d'environnement : l'ancien
 * pixel du salon vivait dans `NEXT_PUBLIC_META_PIXEL_ID`, et une variable
 * oubliée sur Vercel suffirait à le faire revenir à côté de celui-ci. Deux
 * pixels sur la page, c'est chaque évènement compté deux fois, dans deux
 * comptes. Changer de pixel est donc un changement de code, relu.
 */
export const ID_PIXEL = "1006831132445584";

export const EVENEMENTS_META = [
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "Schedule",
  "Purchase",
] as const;
export type EvenementMeta = (typeof EVENEMENTS_META)[number];

/**
 * Les évènements qui ne partent vers l'API Conversions que du serveur, après
 * écriture en base : `/api/meta-capi` est public, un faux achat ou un faux
 * rendez-vous y fausserait précisément ce sur quoi les campagnes s'optimisent.
 * Le navigateur ne les envoie qu'au pixel, avec le même `eventID`.
 */
export const EVENEMENTS_SERVEUR: readonly EvenementMeta[] = ["Schedule", "Purchase"];

/** `eventID` du rendez-vous pris en ligne — le même côté pixel et côté serveur. */
export function idEvenementReservation(reservationId: string): string {
  return `booking_${reservationId}`;
}

/** `eventID` de la venue au salon, signalée depuis le panneau. */
export function idEvenementVisite(reservationId: string): string {
  return `visit_${reservationId}`;
}

/** Ce que Meta lit dans `content_category` : d'où vient l'évènement. */
export const CATEGORIES_META = ["reservation"] as const;
export type CategorieMeta = (typeof CATEGORIES_META)[number];

/**
 * Un article tel que Meta le voit.
 *
 * `id` est l'identifiant Supabase du produit, du coffret ou de la prestation
 * — le même partout, de la fiche à la commande, pour que Meta suive un même
 * article d'un bout à l'autre du parcours.
 */
export type ArticleMeta = {
  id: string;
  name: string;
  priceTnd: number;
  quantity?: number;
};

/** Ce que la cliente a saisi. Haché côté serveur, jamais transmis en clair à Meta. */
export type UtilisateurMeta = {
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
};

export type ParametresMeta = {
  content_ids: string[];
  contents: { id: string; quantity: number; item_price: number }[];
  content_name: string;
  content_type: "product";
  /** Absent pour la boutique ; « reservation » pour les rendez-vous. */
  content_category?: CategorieMeta;
  num_items: number;
  value: number;
  currency: "USD";
};

function enDollars(tnd: number): number {
  return Math.round(tnd * TND_TO_USD * 100) / 100;
}

/**
 * Les paramètres standard de Meta pour une liste d'articles.
 *
 * `valeurTnd` remplace la somme des articles quand le montant réel diffère —
 * le total d'une commande, livraison comprise, ou le prix d'un pack.
 */
export function parametresMeta(
  articles: ArticleMeta[],
  valeurTnd?: number,
  categorie?: CategorieMeta,
): ParametresMeta {
  const lignes = articles.map((a) => ({ ...a, quantity: a.quantity ?? 1 }));
  const somme = lignes.reduce((t, a) => t + a.priceTnd * a.quantity, 0);
  return {
    content_ids: lignes.map((a) => a.id),
    contents: lignes.map((a) => ({
      id: a.id,
      quantity: a.quantity,
      item_price: enDollars(a.priceTnd),
    })),
    content_name: lignes.map((a) => a.name).join(", "),
    content_type: "product",
    ...(categorie ? { content_category: categorie } : {}),
    num_items: lignes.reduce((t, a) => t + a.quantity, 0),
    value: enDollars(valeurTnd ?? somme),
    currency: "USD",
  };
}

// ------------------------------------------------------------ navigateur

/** Commandes et rendez-vous déjà remontés, sur cet appareil. */
const CLE_ACHATS = "cylia.meta.achats";

/** Le pixel arrive après l'hydratation : on l'attend jusqu'à cette limite. */
const ATTENTE_PIXEL_MS = 4000;

function nouvelIdentifiant(): string {
  // `randomUUID` n'existe que sur HTTPS (et localhost) : un téléphone qui
  // ouvre le serveur de développement par l'IP du réseau ne l'a pas.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Lance `travail` dès que `fbq` existe.
 *
 * Le code de base du pixel est inséré `afterInteractive`, donc *après* les
 * premiers effets de la page : une vue de fiche suivie au montage partirait
 * dans le vide. Derrière un bloqueur, `fbq` n'arrive jamais ; on lance quand
 * même au bout du délai, pour que l'envoi serveur parte, lui.
 */
function quandPixelPret(travail: () => void): void {
  if (window.fbq) return travail();
  const debut = Date.now();
  const minuteur = window.setInterval(() => {
    if (window.fbq || Date.now() - debut > ATTENTE_PIXEL_MS) {
      window.clearInterval(minuteur);
      travail();
    }
  }, 100);
}

/** Vrai la première fois qu'on voit cette commande (ou ce rendez-vous) sur cet appareil. */
function premierAchat(idCommande: string): boolean {
  try {
    const deja = JSON.parse(window.localStorage.getItem(CLE_ACHATS) ?? "[]") as unknown;
    const liste = Array.isArray(deja) ? deja.filter((x): x is string => typeof x === "string") : [];
    if (liste.includes(idCommande)) return false;
    window.localStorage.setItem(CLE_ACHATS, JSON.stringify([...liste, idCommande].slice(-20)));
  } catch {
    // Stockage refusé : on remonte quand même — l'`eventID` fixe de l'achat
    // laisse Meta écarter un éventuel doublon.
  }
  return true;
}

/**
 * Remonte un évènement de vente à Meta, par le pixel et par le serveur.
 *
 * Ne lève jamais : une mesure manquée ne doit pas empêcher un ajout au panier.
 *
 * L'achat (`Purchase`) et le rendez-vous (`Schedule`) ne partent que par le
 * pixel : leur pendant serveur est envoyé par `passerCommande` et
 * `confirmerReservation` eux-mêmes, avec les montants relus en base, et le
 * même `eventID` — `order_<référence>`, `booking_<id>`.
 */
export function trackMeta(
  evenement: EvenementMeta,
  articles: ArticleMeta[],
  options: {
    orderId?: string;
    /** `Schedule` : l'`eventID` partagé avec le serveur, `idEvenementReservation`. */
    eventId?: string;
    user?: UtilisateurMeta;
    valeurTnd?: number;
    categorie?: CategorieMeta;
  } = {},
): void {
  if (typeof window === "undefined" || articles.length === 0) return;
  try {
    if (evenement === "Purchase" && (!options.orderId || !premierAchat(options.orderId))) return;
    if (evenement === "Schedule" && (!options.eventId || !premierAchat(options.eventId))) return;

    const params = parametresMeta(articles, options.valeurTnd, options.categorie);
    const eventId =
      evenement === "Purchase"
        ? `order_${options.orderId}`
        : (options.eventId ?? nouvelIdentifiant());
    const url = window.location.href;

    quandPixelPret(() => {
      try {
        window.fbq?.("track", evenement, params, { eventID: eventId });
      } catch {
        // Le script de Meta n'a pas à faire tomber la page.
      }

      if (EVENEMENTS_SERVEUR.includes(evenement)) return;
      // `keepalive` : « Commander maintenant » change de page dans la foulée,
      // la requête doit survivre à la navigation.
      fetch("/api/meta-capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: evenement, eventId, params, url, user: options.user }),
        keepalive: true,
      }).catch(() => {});
    });
  } catch {
    // Idem : rien de ce qui précède ne doit remonter jusqu'au bouton.
  }
}
