/**
 * Contenu éditable du site.
 *
 * Chaque bloc modifiable porte une clé stable. La valeur affichée est celle de
 * la table `contenus` si l'administratrice l'a changée, sinon celle d'ici.
 * Conséquence utile : une base vide affiche quand même un site complet, et
 * « remettre par défaut » revient à supprimer la ligne.
 */
export type ContenuMap = Readonly<Record<string, string>>;

export const CONTENUS_DEFAUT = {
  "site.nom": "CYLIA Maison de Beauté",

  "hero.surtitre": "Votre beauté, notre priorité",
  "hero.titre": "Une expérience beauté",
  "hero.titre_script": "sur mesure",
  "hero.texte": "Soins, esthétique, coiffure et bien-être dans un seul lieu.",
  "hero.bouton": "Réserver",
  "hero.image": "",

  "feature.titre": "Prenez soin",
  "feature.titre_script": "de vous",
  "feature.image": "",

  "galerie.surtitre": "Galerie",
  "galerie.titre": "Nos réalisations",

  "boutique.accueil_surtitre": "Boutique",
  "boutique.accueil_titre": "Nos cosmétiques",
  "boutique.accueil_texte":
    "Les soins que nous utilisons en cabine, à emporter chez vous. Livraison partout en Tunisie.",
  "boutique.accueil_bouton": "Découvrir la boutique",
  "boutique.surtitre": "Cosmétiques",
  "boutique.titre": "Notre",
  "boutique.titre_script": "boutique",
  "boutique.texte": "Livraison partout en Tunisie · paiement à la livraison.",
  "boutique.partenaire_libelle": "Distribué par Maison Keune Tunisie",
  "boutique.partenaire_lien": "https://www.maisonkeune.tn/",

  "reserver.surtitre": "Prendre rendez-vous",
  "reserver.titre": "Réservez votre",
  "reserver.titre_script": "moment",

  "contact.adresse1": "Immeuble Misk Elil, 1er étage",
  "contact.adresse2": "Av. 14 Janvier, Sousse 4059",
  "contact.horaires": "Tous les jours, 10h – 20h",
  "contact.telephone": "54 395 168",
  "contact.telephone_lien": "+21654395168",
  "contact.fixe": "73 807 936",
  "contact.fixe_lien": "+21673807936",
  "contact.whatsapp_numero": "51 395 169",
  "contact.whatsapp": "https://wa.me/21651395169",
  "contact.instagram": "https://www.instagram.com/cyliamaisondebeaute/",
  "contact.instagram_libelle": "cyliamaisondebeaute",
  "contact.facebook": "https://www.facebook.com/share/1CQZPiXwWH/?mibextid=wwXIfr",
  /** Pseudo TikTok confirmé par le salon — il diffère de celui d'Instagram. */
  "contact.tiktok": "https://www.tiktok.com/@cylia.maison.de.b",
  "contact.tiktok_libelle": "cylia maison de beauté",
  "footer.bouton": "Réserver en ligne",

  /**
   * Fiche Google du salon : ce lien ouvre le repère exact.
   *
   * Un lien court `maps.app.goo.gl` ne peut servir ni à la carte intégrée ni à
   * l'itinéraire — il redirige vers google.com, qui refuse d'être affiché dans
   * un cadre et n'accepte pas de lien court comme destination. Ces deux usages
   * passent donc par `maps.requete`, ci-dessous.
   */
  "maps.lien_fiche": "https://maps.app.goo.gl/SbZT2huAiBvk8foH8",
  "maps.requete":
    "CYLIA Maison de Beauté, Immeuble Misk Elil, Avenue 14 Janvier, Sousse 4059",
} as const;

export type CleContenu = keyof typeof CONTENUS_DEFAUT;

/** Libellés du panneau d'administration — l'ordre est celui de l'affichage. */
export const GROUPES_CONTENU: { titre: string; cles: CleContenu[] }[] = [
  {
    titre: "Accueil — bandeau",
    cles: ["hero.surtitre", "hero.titre", "hero.titre_script", "hero.texte", "hero.bouton"],
  },
  { titre: "Accueil — « Prenez soin de vous »", cles: ["feature.titre", "feature.titre_script"] },
  { titre: "Accueil — galerie", cles: ["galerie.surtitre", "galerie.titre"] },
  {
    titre: "Accueil — encart boutique",
    cles: [
      "boutique.accueil_surtitre",
      "boutique.accueil_titre",
      "boutique.accueil_texte",
      "boutique.accueil_bouton",
    ],
  },
  {
    titre: "Page boutique",
    cles: [
      "boutique.surtitre",
      "boutique.titre",
      "boutique.titre_script",
      "boutique.texte",
      "boutique.partenaire_libelle",
      "boutique.partenaire_lien",
    ],
  },
  {
    titre: "Page réservation",
    cles: ["reserver.surtitre", "reserver.titre", "reserver.titre_script"],
  },
  {
    titre: "Coordonnées",
    cles: [
      "site.nom",
      "contact.adresse1",
      "contact.adresse2",
      "contact.horaires",
      "contact.telephone",
      "contact.telephone_lien",
      "contact.fixe",
      "contact.fixe_lien",
      "contact.whatsapp_numero",
      "contact.whatsapp",
      "contact.instagram",
      "contact.instagram_libelle",
      "contact.facebook",
      "contact.tiktok",
      "contact.tiktok_libelle",
      "footer.bouton",
      "maps.lien_fiche",
      "maps.requete",
    ],
  },
];

export function valeurContenu(contenus: ContenuMap, cle: CleContenu): string {
  const valeur = contenus[cle];
  return valeur !== undefined && valeur !== "" ? valeur : CONTENUS_DEFAUT[cle];
}
