import PhotoDistante from "@/components/PhotoDistante";
import { estPhotoDeGroupe } from "@/lib/coffrets";

/**
 * Visuel d'un coffret — toujours une seule image, le coffret entier.
 *
 * La photo du coffret déposée dans le panneau occupe toute la vignette : c'est
 * une mise en scène, donc `object-cover`. La photo de groupe assemblée à
 * partir des packshots (`scripts/visuels-coffrets.mjs`) est transparente et
 * déjà cadrée, flacons serrés : `object-contain`, sur le fond clair de la
 * boutique.
 *
 * Sans l'une ni l'autre — un coffret tout juste composé —, les flacons se
 * rangent côte à côte et se chevauchent sur une même ligne, agrandis pour
 * compenser la marge transparente des packshots : le coffret a l'air d'un
 * coffret avant même d'être photographié.
 *
 * `preload` : pour les toutes premières cartes, visibles sans défiler. Toutes
 * les autres images restent en chargement différé, le défaut de `next/image`.
 */
export default function VisuelCoffret({
  nom,
  photos,
  sizes = "50vw",
  preload = false,
}: {
  nom: string;
  /** `visuelsDuCoffret()` : la photo du coffret, sa photo de groupe, ou celles de ses flacons. */
  photos: string[];
  sizes?: string;
  preload?: boolean;
}) {
  const repli = (
    <div aria-hidden="true" className="flex h-full items-center justify-center">
      <span className="font-script text-4xl text-gold-deep/70">
        {nom.trim().charAt(0) || "C"}
      </span>
    </div>
  );

  if (photos.length <= 1) {
    const groupe = photos[0] ? estPhotoDeGroupe(photos[0]) : false;
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-cream to-white">
        {photos[0] ? (
          <PhotoDistante
            src={photos[0]}
            alt={nom}
            fill
            sizes={sizes}
            preload={preload}
            className={groupe ? "object-contain p-[3%]" : "object-cover"}
            repli={repli}
          />
        ) : (
          repli
        )}
      </div>
    );
  }

  const flacons = photos.slice(0, 4);
  // Chaque flacon n'occupe qu'une fraction de la largeur : on demande donc des
  // fichiers à la mesure de cette fraction, pas de la vignette entière.
  const tailleFlacon = sizes.replace(/(\d+(?:\.\d+)?)vw/g, (_, n: string) =>
    `${Math.round(Number(n) / 2)}vw`,
  );
  return (
    <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-b from-cream to-white px-[4%] pb-[6%]">
      {flacons.map((url, index) => {
        const centre = Math.abs(index - (flacons.length - 1) / 2) < 0.6;
        return (
          <div
            key={`${url}-${index}`}
            className={`relative -mx-[3%] flex-1 ${centre ? "z-10 h-[88%]" : "h-[78%]"}`}
          >
            <PhotoDistante
              src={url}
              alt={index === 0 ? nom : ""}
              fill
              sizes={tailleFlacon}
              preload={preload}
              className="origin-bottom scale-[1.45] object-contain object-bottom"
              repli={null}
            />
          </div>
        );
      })}
    </div>
  );
}
