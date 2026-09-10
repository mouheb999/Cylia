export const site = {
  nom: "CYLIA Maison de Beauté",
  telephone: "54 395 168",
  telephoneLien: "+21654395168",
  whatsapp: "https://wa.me/21654395168",
  instagram: "https://www.instagram.com/cyliamaisondebeaute/",
  adresse: {
    ligne1: "Immeuble Misk Elil, 1er étage",
    ligne2: "Av. 14 Janvier, Sousse 4059",
  },
  horaires: "Tous les jours, 10h – 20h",
  /**
   * Adresse envoyée à Google Maps pour la carte et l'itinéraire.
   *
   * Elle situe le salon à l'adresse indiquée, pas nécessairement sur la porte :
   * pour un repère exact, ouvrir la fiche Google du salon, « Partager » →
   * « Copier le lien », et remplacer `lienFiche` par ce lien.
   */
  maps: {
    requete: "CYLIA Maison de Beauté, Immeuble Misk Elil, Avenue 14 Janvier, Sousse 4059",
    /** Lien de la fiche Google Business, s'il est connu. Prioritaire sur la requête. */
    lienFiche: "",
  },
} as const;

const requeteEncodee = encodeURIComponent(site.maps.requete);

/** Ouvre Google Maps sur le salon (l'application native sur téléphone). */
export const lienMaps =
  site.maps.lienFiche ||
  `https://www.google.com/maps/search/?api=1&query=${requeteEncodee}`;

/** Lance un itinéraire vers le salon depuis la position de la visiteuse. */
export const lienItineraire = `https://www.google.com/maps/dir/?api=1&destination=${requeteEncodee}`;

/** Carte interactive intégrée — sans clé d'API. */
export const carteIntegree = `https://www.google.com/maps?q=${requeteEncodee}&output=embed`;
