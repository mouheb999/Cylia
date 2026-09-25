import PhotoDistante from "@/components/PhotoDistante";

/**
 * Visuel d'un coffret.
 *
 * Avec la photo du coffret tout prêt, elle occupe toute la vignette : c'est une
 * mise en scène, pas un packshot détouré, donc `object-cover`. Sans elle, les
 * flacons choisis se rangent côte à côte — deux, trois ou quatre sur le même
 * fond clair que la boutique — pour qu'un coffret composé dans le panneau ait
 * l'air d'un coffret avant même d'être photographié.
 */
export default function VisuelCoffret({
  nom,
  photos,
  sizes = "50vw",
}: {
  nom: string;
  /** `visuelsDuCoffret()` : la photo du coffret, ou celles de ses flacons. */
  photos: string[];
  sizes?: string;
}) {
  const repli = (
    <div aria-hidden="true" className="flex h-full items-center justify-center">
      <span className="font-script text-4xl text-gold-deep/70">
        {nom.trim().charAt(0) || "C"}
      </span>
    </div>
  );

  if (photos.length <= 1) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-cream to-white">
        {photos[0] ? (
          <PhotoDistante
            src={photos[0]}
            alt={nom}
            fill
            sizes={sizes}
            className="object-cover"
            repli={repli}
          />
        ) : (
          repli
        )}
      </div>
    );
  }

  const mosaique = photos.slice(0, 4);
  return (
    <div
      className={`absolute inset-0 grid gap-px bg-sand ${
        mosaique.length === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2"
      }`}
    >
      {mosaique.map((url, index) => (
        <div
          key={`${url}-${index}`}
          className={`relative bg-gradient-to-b from-cream to-white ${
            mosaique.length === 3 && index === 0 ? "row-span-2" : ""
          }`}
        >
          <PhotoDistante
            src={url}
            alt={index === 0 ? nom : ""}
            fill
            sizes={sizes}
            className="object-contain p-1.5"
            repli={null}
          />
        </div>
      ))}
    </div>
  );
}
