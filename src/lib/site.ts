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
  maps: {
    /**
     * Fiche Google du salon. Ce lien ouvre le repère exact — c'est lui qu'on
     * utilise partout où la visiteuse quitte le site pour Google Maps.
     */
    lienFiche: "https://maps.app.goo.gl/SbZT2huAiBvk8foH8",
    /**
     * Adresse utilisée pour la carte intégrée et l'itinéraire.
     *
     * Un lien court `maps.app.goo.gl` ne peut servir ni à l'une ni à l'autre :
     * il redirige vers google.com, qui refuse d'être affiché dans un cadre et
     * n'accepte pas de lien court comme destination d'itinéraire. Ces deux
     * usages passent donc par le nom et l'adresse du salon.
     *
     * Pour un repère au mètre près sur la carte intégrée, remplacer `requete`
     * par les coordonnées de la fiche, au format « latitude,longitude ». On les
     * lit dans l'URL longue de Google Maps sur ordinateur, juste après le `@`.
     */
    requete: "CYLIA Maison de Beauté, Immeuble Misk Elil, Avenue 14 Janvier, Sousse 4059",
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
