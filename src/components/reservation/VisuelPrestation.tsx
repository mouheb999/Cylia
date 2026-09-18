import PhotoDistante from "@/components/PhotoDistante";
import { IconBienEtre, IconCoiffure, IconEsthetique } from "@/components/Icons";

const ICONES: Record<string, typeof IconCoiffure> = {
  coiffure: IconCoiffure,
  esthetique: IconEsthetique,
  "bien-etre": IconBienEtre,
};

/**
 * Photo d'une prestation, dans le tunnel de réservation.
 *
 * Sans photo — et le salon commence sans aucune — la vignette montre l'icône
 * de la catégorie sur un fond sombre. C'est volontairement discret : une
 * rangée d'icônes se lit comme un motif, là où une rangée de rectangles vides
 * se lirait comme une panne. Le jour où le salon dépose ses photos, elles
 * prennent la place sans que rien d'autre ne bouge.
 *
 * L'icône sert aussi de dernier recours quand une photo existe mais refuse de
 * s'afficher : mieux vaut le motif que la vignette cassée du navigateur.
 */
export default function VisuelPrestation({
  nom,
  categorieId,
  url,
  sizes = "72px",
  className = "",
  tailleIcone = "h-7 w-7",
}: {
  nom: string;
  categorieId: string;
  url: string | null;
  /** Largeur rendue, pour que Next serve la bonne taille de fichier. */
  sizes?: string;
  className?: string;
  /** L'icône de repli ne se voit plus sur un grand bandeau : à ajuster. */
  tailleIcone?: string;
}) {
  const Icone = ICONES[categorieId] ?? IconEsthetique;
  const repli = (
    <span className="flex h-full items-center justify-center" aria-hidden="true">
      <Icone className={`${tailleIcone} text-gold/45`} />
    </span>
  );

  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-xl bg-white/[0.06] ${className}`}
    >
      {url ? (
        <PhotoDistante
          src={url}
          alt={nom}
          fill
          sizes={sizes}
          className="object-cover"
          repli={repli}
        />
      ) : (
        repli
      )}
    </span>
  );
}
