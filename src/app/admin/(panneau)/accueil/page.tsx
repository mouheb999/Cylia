import GestionPhotos from "@/components/admin/GestionPhotos";
import PhotoUnique from "@/components/admin/PhotoUnique";
import { contenusAdmin, photosAdmin } from "@/lib/donnees-admin";

export const metadata = { title: "Photos de l'accueil — CYLIA" };

export default async function PagePhotosAccueil() {
  const [bandeau, galerie, contenus] = await Promise.all([
    photosAdmin("accueil"),
    photosAdmin("galerie"),
    contenusAdmin(),
  ]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-cream">Photos de l&apos;accueil</h1>
      <p className="mt-1 text-sm font-light leading-relaxed text-white/45">
        Toutes les images de la page d&apos;accueil se déposent ici. Les photos
        des prestations et des produits, elles, restent sur leurs fiches, dans
        « Prestations » et « Produits ».
      </p>

      <section className="mt-7">
        <h2 className="font-serif text-lg font-light text-gold">Bandeau du haut</h2>
        <p className="mt-1 mb-3 text-xs font-light leading-relaxed text-white/40">
          Elles se relaient toutes seules, en fondu, dans l&apos;ordre de cette
          liste — quatre photos font un bon tour. Personne ne peut les faire
          défiler à la main : c&apos;est voulu, le haut de la page n&apos;est pas
          un endroit où l&apos;on manipule. Des photos verticales, prises en
          hauteur, remplissent le mieux le cadre.
        </p>
        <GestionPhotos
          photos={bandeau}
          emplacement="accueil"
          dossier="bandeau"
          altParDefaut="La Maison de Beauté CYLIA à Sousse"
          apercu="aspect-[4/5]"
          vide="Aucune photo de bandeau : c'est celle livrée avec le site qui s'affiche. Déposez-en une ou plusieurs pour la remplacer."
        />
      </section>

      <section className="mt-9">
        <h2 className="font-serif text-lg font-light text-gold">Au fil de la page</h2>
        <div className="mt-3 space-y-3">
          <PhotoUnique
            cle="feature.image"
            titre="Photo « Prenez soin de vous »"
            description="Le grand encart entre les services et les offres. Une photo large, plutôt sombre sur la droite, où le titre vient se poser."
            valeur={contenus["feature.image"] ?? ""}
            apercu="h-24 w-full"
          />
          <PhotoUnique
            cle="logo.image"
            titre="Logo de l'en-tête"
            description="Il s'affiche sur toutes les pages, en haut au centre. Un fichier carré, fond transparent de préférence."
            valeur={contenus["logo.image"] ?? ""}
            dossier="logo"
            apercu="h-24 w-24"
            ajustement="object-contain"
          />
        </div>
      </section>

      <section className="mt-9">
        <h2 className="font-serif text-lg font-light text-gold">Galerie « Nos réalisations »</h2>
        <p className="mt-1 mb-3 text-xs font-light leading-relaxed text-white/40">
          Elles s&apos;affichent deux par rangée, en bas de l&apos;accueil, dans
          l&apos;ordre de cette liste. Tant qu&apos;il n&apos;y en a aucune, ce
          sont les quatre photos livrées avec le site qui tiennent la place.
        </p>
        <GestionPhotos
          photos={galerie}
          emplacement="galerie"
          dossier="galerie"
          altParDefaut="Réalisation CYLIA Maison de Beauté"
          apercu="aspect-[4/5]"
          vide="Aucune photo : ce sont les quatre photos d'origine qui s'affichent."
        />
      </section>
    </div>
  );
}
