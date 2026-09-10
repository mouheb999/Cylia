import { CONTENUS_DEFAUT, valeurContenu } from "./contenu";
import type { ContenuMap } from "./contenu";

/**
 * Coordonnées du salon, telles qu'affichées.
 *
 * Tout vient de `contenus` : l'administratrice peut corriger une adresse ou un
 * numéro depuis le site, sans redéploiement. Les valeurs par défaut vivent
 * dans `contenu.ts`.
 */
export type InfosSite = {
  nom: string;
  telephone: string;
  telephoneLien: string;
  whatsapp: string;
  instagram: string;
  instagramLibelle: string;
  adresse: { ligne1: string; ligne2: string };
  horaires: string;
  /** Ouvre Google Maps sur le salon (l'application native sur téléphone). */
  lienMaps: string;
  /** Lance un itinéraire depuis la position de la visiteuse. */
  lienItineraire: string;
  /** Carte interactive intégrée — sans clé d'API. */
  carteIntegree: string;
};

export function infosSite(contenus: ContenuMap = {}): InfosSite {
  const lire = (cle: keyof typeof CONTENUS_DEFAUT) => valeurContenu(contenus, cle);
  const requete = encodeURIComponent(lire("maps.requete"));
  const fiche = lire("maps.lien_fiche");

  return {
    nom: lire("site.nom"),
    telephone: lire("contact.telephone"),
    telephoneLien: lire("contact.telephone_lien"),
    whatsapp: lire("contact.whatsapp"),
    instagram: lire("contact.instagram"),
    instagramLibelle: lire("contact.instagram_libelle"),
    adresse: { ligne1: lire("contact.adresse1"), ligne2: lire("contact.adresse2") },
    horaires: lire("contact.horaires"),
    lienMaps: fiche || `https://www.google.com/maps/search/?api=1&query=${requete}`,
    lienItineraire: `https://www.google.com/maps/dir/?api=1&destination=${requete}`,
    carteIntegree: `https://www.google.com/maps?q=${requete}&output=embed`,
  };
}
