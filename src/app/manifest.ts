import type { MetadataRoute } from "next";

/**
 * Ce qui fait du site une application installable.
 *
 * `start_url` pointe sur le panneau, pas sur l'accueil : celle qui installe
 * CYLIA sur son écran d'accueil, c'est le salon. Une cliente n'installe pas le
 * site d'un institut, elle le visite. Et sur iOS, l'installation n'est pas un
 * confort : c'est la seule façon d'y recevoir des notifications.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CYLIA Maison de Beauté",
    short_name: "CYLIA",
    description:
      "Rendez-vous, commandes et planning du salon CYLIA Maison de Beauté, Sousse.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0a09",
    theme_color: "#0b0a09",
    lang: "fr",
    dir: "ltr",
    categories: ["business", "lifestyle"],
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      {
        name: "Demandes à confirmer",
        short_name: "À confirmer",
        url: "/admin/reservations?vue=a-confirmer",
      },
      { name: "Rendez-vous du jour", short_name: "Aujourd'hui", url: "/admin/reservations?vue=jour" },
      { name: "Commandes", short_name: "Commandes", url: "/admin/commandes" },
    ],
  };
}
