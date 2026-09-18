/**
 * Schéma de la base, côté TypeScript.
 *
 * Écrit à la main plutôt que généré : le schéma est petit, et une table qu'on
 * relit reste une table qu'on comprend. À tenir à jour avec
 * `supabase/migrations/`.
 */

/** `Insert` = les colonnes obligatoires, plus tout le reste en facultatif. */
type Ligne<R, Obligatoires extends keyof R = never> = {
  Row: R;
  Insert: Pick<R, Obligatoires> & Partial<Omit<R, Obligatoires>>;
  Update: Partial<R>;
  Relationships: [];
};

export type Categorie = {
  id: string;
  nom: string;
  description: string;
  ordre: number;
  actif: boolean;
};

export type Prestation = {
  id: string;
  nom: string;
  categorie_id: string;
  /** Groupe auquel elle appartient — voir la table `groupes`. */
  groupe_id: string | null;
  duree_minutes: number;
  prix: number | null;
  /**
   * Le prix est un point de départ, pas un tarif ferme : le site annonce
   * alors « À partir de 40 DT ». Sans prix, la mention n'a pas de sens — la
   * base le refuse (migration 0027).
   */
  prix_a_partir_de: boolean;
  /** Tarif remisé, sous `prix`. `null` : pas d'offre en cours. */
  prix_promo: number | null;
  /** Ce que l'offre annonce — « Offre de printemps ». Vide : rien d'écrit. */
  promo_libelle: string;
  /** Dernier jour de l'offre, inclus. `null` : jusqu'à ce qu'on la retire. */
  promo_fin: string | null;
  description: string;
  image_url: string | null;
  ordre: number;
  actif: boolean;
  cree_le: string;
};

export type StatutReservation = "en_attente" | "confirmee" | "terminee" | "annulee";

export type Reservation = {
  id: string;
  reference: string;
  prestation_ids: string[];
  prestations_nom: string[];
  date: string;
  heure_minutes: number;
  duree_minutes: number;
  nom: string;
  telephone: string;
  note: string | null;
  prix_total: number | null;
  statut: StatutReservation;
  cree_le: string;
};

export type Contenu = {
  cle: string;
  valeur: string;
  type: "texte" | "image" | "lien";
  maj_le: string;
};

/** Où la photo est montrée : le bandeau de l'accueil, ou la galerie. */
export type EmplacementPhoto = "galerie" | "accueil";

export type PhotoGalerie = {
  id: string;
  image_url: string;
  alt: string;
  emplacement: EmplacementPhoto;
  ordre: number;
  actif: boolean;
  cree_le: string;
};

export type Groupe = {
  id: string;
  categorie_id: string;
  nom: string;
  description: string;
  /** Couverture : la vignette du groupe dans la liste. */
  image_url: string | null;
  /** Album montré en haut du groupe ouvert, couverture en tête. */
  images: string[];
  /** La carte des prestations du groupe affiche-t-elle leur durée ? */
  duree_visible: boolean;
  ordre: number;
  actif: boolean;
  cree_le: string;
};

export type Produit = {
  id: string;
  slug: string;
  nom: string;
  marque: string;
  description: string;
  prix: number;
  ancien_prix: number | null;
  image_url: string | null;
  categorie: string;
  /** Ce que le produit est — shampooing, masque, coloration. Voir `@/lib/produits`. */
  famille: string;
  stock: number;
  ordre: number;
  actif: boolean;
  cree_le: string;
};

/**
 * Un pack : une formule que le salon compose et annonce sur l'accueil.
 *
 * `prix` est facultatif — un pack « sur devis » s'annonce sans chiffre, et la
 * carte n'affiche alors rien à cet endroit.
 */
export type Pack = {
  id: string;
  nom: string;
  description: string;
  prix: number | null;
  image_url: string | null;
  ordre: number;
  actif: boolean;
  cree_le: string;
};

export type StatutCommande =
  | "en_attente"
  | "confirmee"
  | "expediee"
  | "livree"
  | "annulee";

export type Commande = {
  id: string;
  reference: string;
  nom: string;
  telephone: string;
  email: string | null;
  adresse: string;
  ville: string;
  note: string | null;
  sous_total: number;
  livraison: number;
  total: number;
  statut: StatutCommande;
  cree_le: string;
};

export type ArticleCommande = {
  id: string;
  commande_id: string;
  produit_id: string | null;
  nom: string;
  prix: number;
  quantite: number;
};

export type Reglages = {
  id: number;
  ouverture_minutes: number;
  fermeture_minutes: number;
  pas_minutes: number;
  capacite_simultanee: number;
  delai_minimum_minutes: number;
  jours_proposes: number;
  devise: string;
  frais_livraison: number;
  livraison_gratuite_des: number | null;
  reservation_active: boolean;
  boutique_active: boolean;
  maj_le: string;
};

export type Fermeture = {
  id: string;
  date_debut: string;
  date_fin: string;
  motif: string | null;
  cree_le: string;
};

/** Un appareil du salon abonné aux notifications. Voir `lib/notifications/push`. */
export type AbonnementPush = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  agent: string | null;
  cree_le: string;
  vu_le: string;
};

export type Administrateur = {
  user_id: string;
  email: string | null;
  nom: string | null;
  cree_le: string;
};

export type Database = {
  public: {
    Tables: {
      administrateurs: Ligne<Administrateur, "user_id">;
      abonnements_push: Ligne<AbonnementPush, "user_id" | "endpoint" | "p256dh" | "auth">;
      categories: Ligne<Categorie, "id" | "nom">;
      prestations: Ligne<Prestation, "id" | "nom" | "categorie_id" | "duree_minutes">;
      reservations: Ligne<Reservation, "reference" | "prestation_ids" | "date" | "heure_minutes" | "duree_minutes" | "nom" | "telephone">;
      contenus: Ligne<Contenu, "cle">;
      galerie: Ligne<PhotoGalerie, "image_url">;
      groupes: Ligne<Groupe, "categorie_id" | "nom">;
      produits: Ligne<Produit, "slug" | "nom" | "prix">;
      packs: Ligne<Pack, "nom">;
      commandes: Ligne<Commande, "reference" | "nom" | "telephone" | "adresse" | "ville" | "sous_total" | "total">;
      commande_articles: Ligne<ArticleCommande, "commande_id" | "nom" | "prix" | "quantite">;
      reglages: Ligne<Reglages>;
      fermetures: Ligne<Fermeture, "date_debut" | "date_fin">;
    };
    Views: Record<never, never>;
    Functions: {
      est_admin: { Args: Record<never, never>; Returns: boolean };
      donnees_publiques: { Args: Record<never, never>; Returns: unknown };
      occupation_du_jour: {
        Args: { p_date: string };
        Returns: { debut: number; fin: number }[];
      };
      creer_reservation: {
        Args: {
          p_prestation_ids: string[];
          p_date: string;
          p_heure_minutes: number;
          p_nom: string;
          p_telephone: string;
          p_note?: string | null;
        };
        Returns: Reservation;
      };
      creer_commande: {
        Args: {
          p_articles: { produit_id: string; quantite: number }[];
          p_nom: string;
          p_telephone: string;
          p_adresse: string;
          p_ville: string;
          p_email?: string | null;
          p_note?: string | null;
        };
        Returns: unknown;
      };
      statistiques_admin: { Args: Record<never, never>; Returns: unknown };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
